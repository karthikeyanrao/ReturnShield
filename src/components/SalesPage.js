import React, { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './SalesPage.css';

// Mock product catalog
const PRODUCTS = [
  { id: '1001', name: 'Apple', price: 0.99, image: 'https://placehold.co/60x60/apple' },
  { id: '1002', name: 'Milk', price: 2.49, image: 'https://placehold.co/60x60/milk' },
  { id: '1003', name: 'Bread', price: 1.99, image: 'https://placehold.co/60x60/bread' },
  { id: '1004', name: 'Eggs', price: 3.29, image: 'https://placehold.co/60x60/eggs' },
  { id: '1005', name: 'Banana', price: 0.59, image: 'https://placehold.co/60x60/banana' },
  { id: '1006', name: 'Chicken Breast', price: 6.99, image: 'https://placehold.co/60x60/chicken' },
  { id: '1007', name: 'Orange Juice', price: 3.99, image: 'https://placehold.co/60x60/oj' },
  { id: '1008', name: 'Cereal', price: 4.49, image: 'https://placehold.co/60x60/cereal' },
];

function SalesPage() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const filteredProducts = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.includes(search)
  );

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
      const snapshot = await getDocs(collection(db, 'coupons'));
      const found = snapshot.docs.map(doc => doc.data()).find(c => c.couponCode === couponCode);
      if (!found) {
        setError('Invalid or expired coupon code.');
        setCheckingCoupon(false);
        return;
      }
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

  const handleCheckout = () => {
    setReceipt({
      items: cart,
      subtotal,
      discount,
      tax,
      total,
      coupon: coupon ? coupon.couponCode : null,
      time: new Date().toLocaleString(),
    });
    setCart([]);
    setCouponCode('');
    setCoupon(null);
    setDiscount(0);
  };

  return (
    <div className="sales-container">
      <h1 className="sales-header">Sales / Billing</h1>
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Search products or scan barcode..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field w-full"
        />
      </div>
      <div className="sales-product-grid">
        {filteredProducts.map(product => (
          <div key={product.id} className="sales-product-card">
            <img src={product.image} alt={product.name} />
            <div className="name">{product.name}</div>
            <div className="price">${product.price.toFixed(2)}</div>
            <button
              className="add-btn"
              onClick={() => addToCart(product)}
            >
              Add
            </button>
          </div>
        ))}
      </div>
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
          disabled={cart.length === 0}
        >
          Pay & Checkout
        </button>
      </div>
      {receipt && (
        <div className="sales-receipt">
          <h2>Receipt</h2>
          <div className="mb-2 text-text-secondary">{receipt.time}</div>
          <table className="w-full text-left mb-2">
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
          <div className="summary">
            <div>Subtotal: <span className="font-semibold">${receipt.subtotal.toFixed(2)}</span></div>
            <div>Discount: <span className="font-semibold text-status-success">-${receipt.discount.toFixed(2)}</span></div>
            <div>Tax: <span className="font-semibold">${receipt.tax.toFixed(2)}</span></div>
            <div className="total">Total: <span>${receipt.total.toFixed(2)}</span></div>
            {receipt.coupon && <div className="coupon">Coupon used: {receipt.coupon}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesPage; 