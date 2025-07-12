import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './SalesPage.css';
import { ethers } from 'ethers';
import CouponNFT from '../contracts/CouponNFT.json';
import html2pdf from 'html2pdf.js';

const COUPON_NFT_ADDRESS = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
function SalesPage() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [billNo, setBillNo] = useState('');
  const [mintHash, setMintHash] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoadingInventory(true);
    try {
      const snapshot = await getDocs(collection(db, 'inventory'));
      // Always set id: doc.id
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInventory(data);
    } catch (err) {
      setInventory([]);
    }
    setLoadingInventory(false);
  };

  // Show all products, regardless of cart
  const filteredProducts = inventory.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || (p.id && p.id.includes(search))
  );

  // Helper: get quantity of a product in the cart
  const getCartQty = (productId) => {
    const item = cart.find(i => i.id === productId);
    return item ? item.qty : 0;
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, qty) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: Math.max(1, qty) } : item));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = +(subtotal * 0.07).toFixed(2); // 7% sales tax
  const total = +(subtotal - discount + tax).toFixed(2);

  const handleApplyCoupon = async () => {
    setCheckingCoupon(true);
    setError('');
    setCoupon(null);
    setDiscount(0);
    try {
      const q = query(collection(db, 'coupons'), where('couponCode', '==', couponCode));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setError('Invalid or expired coupon code.');
        setCheckingCoupon(false);
        return;
      }
      const found = snapshot.docs[0].data();
      setCoupon(found);
      // Cap discount to subtotal
      setDiscount(prevSubtotal => {
        const disc = found.value;
        return disc > total ? total : disc;
      });
    } catch (err) {
      setError('Error checking coupon.');
    }
    setCheckingCoupon(false);
  };

  const handleCancelCoupon = () => {
    setCouponCode('');
    setCoupon(null);
    setDiscount(0);
    setError('');
  };

  // Bill number generator
  const getNextBillNo = () => {
    let last = localStorage.getItem('lastBillNo');
    let num = last ? parseInt(last.replace('PUR', '')) + 1 : 1;
    let bill = `PUR${num.toString().padStart(3, '0')}`;
    localStorage.setItem('lastBillNo', bill);
    return bill;
  };

  const handleCheckout = async () => {
    setError('');
    setMintHash('');
    setCheckoutLoading(true);
    try {
      // 1. Check stock in Firebase for each cart item using doc ID
      for (const cartItem of cart) {
        const itemRef = doc(db, 'inventory', cartItem.id);
        const itemSnap = await getDocs(collection(db, 'inventory'));
        const itemDoc = itemSnap.docs.find(d => d.id === cartItem.id);
        const itemData = itemDoc ? itemDoc.data() : null;
        if (!itemData || cartItem.qty > itemData.qty) {
          setCheckoutLoading(false);
          setError(`Insufficient stock for ${cartItem.name}. You requested ${cartItem.qty}, but only ${itemData ? itemData.qty : 0} left in inventory.`);
          return;
        }
      }
      console.log('--- Checkout started ---');
      if (!window.ethereum) throw new Error('MetaMask not detected');
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('MetaMask account access granted');
      let provider, signer, tx, ethTxHash = '', mintTxHash = '';
      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
      // Payment logic (send to self)
      const ethPrice = 1000; // USD per ETH (static for demo)
      const ethAmount = (total / ethPrice).toFixed(6);
      console.log('ETH amount to send:', ethAmount);
      const sender = await signer.getAddress();
      tx = await signer.sendTransaction({
        to: sender,
        value: ethers.parseEther(ethAmount)
      });
      console.log('Payment transaction sent:', tx.hash);
      await tx.wait();
      ethTxHash = tx.hash;
      console.log('Payment transaction confirmed:', ethTxHash);
      // Bill number
      const bill = getNextBillNo();
      setBillNo(bill);
      console.log('Generated bill number:', bill);
      // Prepare NFT metadata
      const meta = {
        billNo: bill,
        items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
        subtotal,
        discount,
        tax,
        total,
        coupon: coupon ? coupon.couponCode : '',
        time: new Date().toLocaleString(),
        ethTxHash
      };
      console.log('NFT metadata:', meta);
      // Mint NFT
      const contract = new ethers.Contract(COUPON_NFT_ADDRESS, CouponNFT.abi, signer);
      const metaString = JSON.stringify(meta);
      console.log('About to mint NFT...');
      try {
        const mintTx = await contract.mintReceipt(signer.address, bill, metaString);
        console.log('Mint transaction sent:', mintTx.hash);
        await mintTx.wait();
        mintTxHash = mintTx.hash;
        setMintHash(mintTxHash);
        console.log('Mint transaction confirmed:', mintTxHash);
      } catch (mintErr) {
        console.error('Minting error:', mintErr);
        setError(mintErr.message || 'Minting failed');
        return;
      }
      // Show receipt
      const receiptObj = {
        items: cart,
        subtotal,
        discount,
        tax,
        total,
        coupon: coupon ? coupon.couponCode : null,
        time: meta.time,
        billNo: bill,
        mintTxHash,
        ethTxHash
      };
      setReceipt(receiptObj);
      setShowReceiptModal(true);
      setCart([]);
      setCouponCode('');
      setCoupon(null);
      setDiscount(0);
      console.log('--- Checkout complete ---');
      // Store in Firebase
      await addDoc(collection(db, 'receipts'), {
        ...meta,
        billNo: bill,
        mintTxHash,
        createdAt: serverTimestamp(),
      });
      console.log('Receipt stored in Firebase');

      if (coupon && coupon.couponCode) {
        // 1. Find the coupon in Firestore
        const q = query(collection(db, 'coupons'), where('couponCode', '==', coupon.couponCode));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const couponDocRef = snapshot.docs[0].ref;
          console.log('Attempting to delete coupon:', coupon.couponCode, couponDocRef.path);
          try {
            await deleteDoc(couponDocRef);
            console.log('Coupon deleted from Firestore:', coupon.couponCode);
          } catch (deleteErr) {
            console.error('Error deleting coupon from Firestore:', deleteErr);
          }
        } else {
          console.warn('Coupon not found in Firestore, cannot delete.');
        }
      }
      // 3. After successful payment, update inventory in Firebase using doc ID
      for (const cartItem of cart) {
        const itemRef = doc(db, 'inventory', cartItem.id);
        const itemSnap = await getDocs(collection(db, 'inventory'));
        const itemDoc = itemSnap.docs.find(d => d.id === cartItem.id);
        const itemData = itemDoc ? itemDoc.data() : null;
        if (itemDoc && itemData) {
          await updateDoc(itemRef, { qty: itemData.qty - cartItem.qty });
        }
      }
      // After checkout, refresh inventory and clear cart
      await fetchInventory();
      setCart([]);
      setCouponCode('');
      setCoupon(null);
      setDiscount(0);
      setCheckoutLoading(false);

    } catch (err) {
      setCheckoutLoading(false);
      setError(err.message || 'Checkout failed');
      console.error('Checkout error:', err);
    }
  };

  return (
    <div className="sales-container">
      <h1 className="sales-header">Sales / Billing</h1>
      <div className="mb-6 flex gap-4 items-center">
        <input
          type="text"
          placeholder="Search inventory..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field w-full"
        />
      </div>
      {loadingInventory ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : (
        <div className="product-list">
          {filteredProducts.length === 0 ? (
            <div className="empty-state">No items found in inventory.</div>
          ) : (
            <div className="sales-product-grid">
              {filteredProducts.map(product => {
                const cartQty = getCartQty(product.id);
                const availableQty = product.qty - cartQty;
                return (
                  <div key={product.id} className="sales-product-card">
                    <div className="product-info">
                      <div className="product-name">{product.name}</div>
                      <div className="product-price">${product.price.toFixed(2)}</div>
                      {product.qty < 10 && (
                        <div className="low-stock-msg">
                          HURRY!...ONLY {product.qty} NO OF ITEMS LEFT...
                        </div>
                      )}
                    </div>
                    <button
                      className="add-btn"
                      onClick={() => addToCart(product)}
                      disabled={availableQty <= 0}
                    >
                      {availableQty <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {checkoutLoading && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="loading-spinner"><div className="spinner"></div></div>
            <div style={{ textAlign: 'center', marginTop: 16 }}>Processing your order, please wait...</div>
          </div>
        </div>
      )}
      <div className="sales-cart">
        <h2 className="text-lg font-bold mb-4">Cart</h2>
        {cart.length === 0 ? <div className="text-text-secondary">Cart is empty.</div> : (
          <table className="w-full text-left mb-4">
            <thead>
              <tr className="text-text-secondary">
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>
                    <input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={e => updateQty(item.id, +e.target.value)}
                      className="w-16 input-field"
                    />
                  </td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>${(item.price * item.qty).toFixed(2)}</td>
                  <td>
                    <button className="remove-btn" onClick={() => removeFromCart(item.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="sales-coupon-row">
          <input
            type="text"
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={e => setCouponCode(e.target.value)}
            className="input-field"
            disabled={!!coupon}
          />
          <button
            onClick={handleApplyCoupon}
            disabled={!!coupon || checkingCoupon}
          >
            {checkingCoupon ? 'Checking...' : 'Apply Coupon'}
          </button>
          <button
            onClick={handleCancelCoupon}
            disabled={!coupon && !couponCode}
            style={{ background: '#444', color: '#fff', borderRadius: '0.4rem', padding: '0.5rem 1.2rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            Cancel
          </button>
          {coupon && <span className="success">Coupon applied!</span>}
        </div>
        {error && <div className="error mb-2">{error}</div>}
        <div className="summary">
          <div>Subtotal: <span className="font-semibold">${subtotal.toFixed(2)}</span></div>
          <div>Discount: <span className="font-semibold text-status-success">-${discount.toFixed(2)}</span></div>
          <div>Tax (7%): <span className="font-semibold">${tax.toFixed(2)}</span></div>
          <div className="total">Total: <span>${total.toFixed(2)}</span></div>
        </div>
        <button
          className="pay-btn"
          onClick={handleCheckout}
          disabled={cart.length === 0 || checkoutLoading}
        >
          {checkoutLoading ? 'Processing...' : 'Pay & Checkout'}
        </button>
      </div>
      {showReceiptModal && receipt && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="sales-receipt" id="receipt-to-download">
              <h2 className="receipt-title">Store Receipt</h2>
              <div className="receipt-meta mb-2 text-text-secondary">{receipt.time}</div>
              <div className="receipt-billno mb-2 font-bold">Bill No: {receipt.billNo}</div>
              <table className="receipt-table w-full text-left mb-2">
                <thead>
                  <tr className="text-text-secondary">
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.items.map(item => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.qty}</td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>${(item.price * item.qty).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="receipt-summary summary">
                <div>Subtotal: <span className="font-semibold">${receipt.subtotal.toFixed(2)}</span></div>
                <div>Discount: <span className="font-semibold text-status-success">-${receipt.discount.toFixed(2)}</span></div>
                <div>Tax: <span className="font-semibold">${receipt.tax.toFixed(2)}</span></div>
                <div className="total">Total: <span>${receipt.total.toFixed(2)}</span></div>
                {receipt.coupon && <div className="coupon">Coupon used: {receipt.coupon}</div>}
                <div className="mt-2">Mint Tx Hash: <span style={{fontFamily:'monospace'}}>{receipt.mintTxHash}</span></div>
                <div>ETH Payment Tx Hash: <span style={{fontFamily:'monospace'}}>{receipt.ethTxHash}</span></div>
              </div>
              <div className="receipt-actions">
                <button
                  onClick={() => {
                    const element = document.getElementById('receipt-to-download');
                    const opt = {
                      margin: 1,
                      filename: `receipt_${receipt.billNo}.pdf`,
                      image: { type: 'jpeg', quality: 0.98 },
                      html2canvas: { scale: 2 },
                      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                    };
                    html2pdf().from(element).set(opt).save();
                  }}
                  className="download-btn"
                >
                  Download Receipt
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="close-btn"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesPage; 