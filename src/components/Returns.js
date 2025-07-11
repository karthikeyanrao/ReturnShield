import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './SalesPage.css';
import { ethers } from 'ethers';
import CouponNFT from '../contracts/CouponNFT.json';
import html2pdf from 'html2pdf.js';
import './Return.css';
import axios from 'axios';

const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIzNDE3OGU2Yi1hYjc2LTRjZTUtODY3NC1hYjVjNDAwMGZiMDAiLCJlbWFpbCI6InJpcHBsZXNrYXJ0aGlAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjY4MGM0MDQ0YzcwMDkxN2NkNmI0Iiwic2NvcGVkS2V5U2VjcmV0IjoiNTc4ZDE1NjQwNThiZDJmMGYzZjdkYTkwZTFjMmM0ODcyMjZhM2MwMTExMjZjZjQ5MzI5Y2MxZmQ3YjhlZjczZCIsImV4cCI6MTc4MzQ5NjM2OH0.XLR9uHjDAuX13WVrJtOvzI_enVJDpqf1CBudq_6_Nr8';

function generateCouponCode(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function uploadMetadataToPinata({ code, value, expiry, imageUrl }) {
  const metadata = {
    name: code,
    description: `Coupon worth $${value}, expires on ${expiry}`,
    value,
    expiry,
    image: imageUrl || '',
  };
  const res = await axios.post(
    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    metadata,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    }
  );
  return `ipfs://${res.data.IpfsHash}`;
}

async function mintCouponOnChainWithTx({ to, couponCode, tokenURI }, contractAddress, signer) {
  const contract = new ethers.Contract(contractAddress, CouponNFT.abi, signer);
  const tx = await contract.mintCoupon(to, couponCode, tokenURI);
  const receipt = await tx.wait();
  // Find the tokenId from the Transfer event
  const transferEvent = receipt.logs
    .map(log => {
      try { return contract.interface.parseLog(log); } catch { return null; }
    })
    .find(e => e && e.name === 'Transfer');
  const tokenId = transferEvent ? transferEvent.args.tokenId.toString() : null;
  return { tx, tokenId };
}

function Returns() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [returns, setReturns] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [billNoInput, setBillNoInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [fetchingReceipt, setFetchingReceipt] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [fetchError, setFetchError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReceipt, setReturnReceipt] = useState(null);
  const COUPON_NFT_ADDRESS = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponContract, setCouponContract] = useState('');
  const [mintingCoupon, setMintingCoupon] = useState(false);
  const [couponDetails, setCouponDetails] = useState(null);
  const [couponOwner, setCouponOwner] = useState('');
  const [couponError, setCouponError] = useState('');

  // Fetch returned items from Firestore (receipts with returnedItems field)
  useEffect(() => {
    const fetchReturns = async () => {
      setLoading(true);
      const q = query(collection(db, 'returns'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReturns(data);
      setLoading(false);
    };
    fetchReturns();
  }, []);

  // Filtered and searched returns
  const filteredReturns = returns.filter(ret => {
    if (search) {
      const s = search.toLowerCase();
      return (
        (ret.billNo && ret.billNo.toLowerCase().includes(s)) ||
        (ret.time && ret.time.toLowerCase().includes(s)) ||
        (ret.items && ret.items.some(i => i.name.toLowerCase().includes(s)))
      );
    }
    return true;
  }).filter(ret => {
    if (filter === 'all') return true;
    if (filter === 'today') {
      const today = new Date().toLocaleDateString();
      return ret.time && ret.time.includes(today);
    }
    return true;
  });

  // Fetch receipt by billNo or date
  const handleFetchReceipt = async () => {
    setFetchingReceipt(true);
    setFetchError('');
    setReceipt(null);
    setSelectedItems([]);
    try {
      let q;
      if (billNoInput) {
        q = query(collection(db, 'receipts'), where('billNo', '==', billNoInput));
      } else if (dateInput) {
        q = query(collection(db, 'receipts'), where('time', '>=', dateInput));
      } else {
        setFetchError('Please enter Bill No or Date.');
        setFetchingReceipt(false);
        return;
      }
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setFetchError('No receipt found for the given Bill No or Date.');
        setFetchingReceipt(false);
        return;
      }
      const found = snapshot.docs[0].data();
      setReceipt(found);
      // By default, select all items that are not already returned
      setSelectedItems(
        found.items
          .map((item, idx) => ({ ...item, idx }))
          .filter(item => !item.returned)
          .map(item => item.idx)
      );
    } catch (err) {
      setFetchError('Error fetching receipt.');
    }
    setFetchingReceipt(false);
  };

  // Toggle item selection
  const handleToggleItem = idx => {
    setSelectedItems(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  // Helper to get next return bill number
  const getNextReturnBillNo = () => {
    let last = localStorage.getItem('lastReturnBillNo');
    let num = last ? parseInt(last.replace('RET', '')) + 1 : 1;
    let bill = `RET${num.toString().padStart(3, '0')}`;
    localStorage.setItem('lastReturnBillNo', bill);
    return bill;
  };

  // Submit return
  const handleSubmitReturn = async () => {
    if (!receipt || selectedItems.length === 0) return;
    setSubmitting(true);
    try {
      // 1. Update original receipt: mark returned items
      const updatedItems = receipt.items.map((item, idx) =>
        selectedItems.includes(idx) ? { ...item, returned: true } : item
      );
      // Find and update the receipt doc in Firestore
      const q = query(collection(db, 'receipts'), where('billNo', '==', receipt.billNo));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, { items: updatedItems });
      }
      // 2. Prepare return data
      const returnedItems = receipt.items.filter((item, idx) => selectedItems.includes(idx));
      const now = new Date();
      const returnBillNo = getNextReturnBillNo();
      const returnMeta = {
        returnBillNo,
        billNo: receipt.billNo,
        originalTime: receipt.time,
        time: now.toLocaleString(),
        mintTxHash: '', // will be set after mint
        items: returnedItems.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
      };
      // 3. Mint return NFT (simulate or call contract)
      let mintTxHash = '';
      try {
        if (window.ethereum) {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(COUPON_NFT_ADDRESS, CouponNFT.abi, signer);
          const metaString = JSON.stringify(returnMeta);
          const mintTx = await contract.mintReceipt(signer.address, returnBillNo, metaString);
          await mintTx.wait();
          mintTxHash = mintTx.hash;
        }
      } catch (err) {
        mintTxHash = 'Mint failed';
      }
      // 4. Store return in Firestore
      await addDoc(collection(db, 'returns'), {
        ...returnMeta,
        mintTxHash,
        createdAt: serverTimestamp(),
      });
      // 5. Show return receipt modal
      setReturnReceipt({ ...returnMeta, mintTxHash });
      setShowReturnModal(true);
      // 6. Reset modal state
      setReceipt(null);
      setSelectedItems([]);
      setBillNoInput('');
      setDateInput('');
      // 7. Refresh returns list
      const returnsSnap = await getDocs(query(collection(db, 'returns')));
      setReturns(returnsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      alert('Return failed: ' + (err.message || err));
    }
    setSubmitting(false);
    setShowModal(false);
  };

  // Handle Change to Coupon
  const handleChangeToCoupon = () => {
    setShowCouponModal(true);
    setCouponContract('');
    setCouponOwner('');
    setCouponError('');
  };

  // Mint coupon NFT and store in Firestore
  const handleMintCoupon = async () => {
    if (!returnReceipt || !couponContract || !ethers.isAddress(couponOwner) || !ethers.isAddress(couponContract)) {
      setCouponError('Please enter valid addresses.');
      return;
    }
    setMintingCoupon(true);
    try {
      // Calculate coupon value and expiry
      const value = returnReceipt.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
      const expiryDate = new Date(returnReceipt.time);
      expiryDate.setDate(expiryDate.getDate() + 180);
      const expiry = expiryDate.toISOString().split('T')[0];
      // Prepare coupon meta
      const couponCode = generateCouponCode();
      // Upload metadata to Pinata
      const tokenURI = await uploadMetadataToPinata({ code: couponCode, value, expiry, imageUrl: '' });
      let mintTxHash = '';
      let tokenId = '';
      try {
        if (window.ethereum) {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const { tx, tokenId: mintedTokenId } = await mintCouponOnChainWithTx(
            { to: couponOwner, couponCode, tokenURI },
            couponContract,
            signer
          );
          mintTxHash = tx.hash;
          tokenId = mintedTokenId;
        }
      } catch (err) {
        mintTxHash = err?.message || 'Mint failed';
      }
      // Store coupon in Firestore
      await addDoc(collection(db, 'coupons'), {
        couponCode,
        tokenURI,
        value,
        expiry,
        returnBillNo: returnReceipt.returnBillNo,
        contract: couponContract,
        mintTxHash,
        tokenId,
        createdAt: serverTimestamp(),
      });
      setCouponDetails({ couponCode, tokenURI, value, expiry, returnBillNo: returnReceipt.returnBillNo, contract: couponContract, mintTxHash, tokenId });
      setShowCouponModal(false);
    } catch (err) {
      alert('Coupon mint failed: ' + (err.message || err));
    }
    setMintingCoupon(false);
  };

  return (
    <div className="sales-container">
      <h1 className="sales-header">Returns</h1>
      {/* Search/filter/create UI */}
      <div className="mb-6 flex gap-4 items-center">
        <input
          type="text"
          placeholder="Search by bill no, product, or date..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field w-full"
        />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="input-field">
          <option value="all">All</option>
          <option value="today">Today</option>
        </select>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          Create Return
        </button>
      </div>
      {/* Return Cards - moved here for better alignment */}
      <div className="return-cards-list">
        {returns.length === 0 ? (
          <div className="text-text-secondary mb-4">No returns found.</div>
        ) : (
          <div className="return-cards-grid">
            {returns.map(ret => (
              <div className="return-card" key={ret.id || ret.returnBillNo} onClick={() => setSelectedReturn(ret)}>
                <div className="return-card-header">
                  <span className="return-billno">Return Bill No: <b>{ret.returnBillNo}</b></span>
                  
                </div>
                <div className="return-card-meta">
                  <div>Purchase Bill No: <b>{ret.billNo}</b></div>
                  <div>Return Date: <span>{ret.time}</span></div>
                </div>
                <div className="return-card-items">
                  <div className="return-card-items-title">Returned Items:</div>
                  <table className="return-card-items-table">
                    <thead>
                      <tr><th>Product</th><th>Qty</th><th>Price</th></tr>
                    </thead>
                    <tbody>
                      {ret.items && ret.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.name}</td>
                          <td>{item.qty}</td>
                          <td>${item.price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Returned Items Table below */}
      
      {showModal && (
        <div className="modal-overlay return-modal-overlay">
          <div className="modal-content return-modal-content">
            <h2 className="mb-4 return-modal-title">Create Return</h2>
            <p className="return-modal-desc">Enter Bill No or Date to fetch receipt:</p>
            <div className="flex gap-2 mb-2 return-modal-inputs">
              <input
                type="text"
                placeholder="Bill No (e.g. PUR001)"
                value={billNoInput}
                onChange={e => setBillNoInput(e.target.value)}
                className="input-field return-input"
              />
              <input
                type="date"
                value={dateInput}
                onChange={e => setDateInput(e.target.value)}
                className="input-field return-input"
              />
              <button onClick={handleFetchReceipt} disabled={fetchingReceipt} className="add-btn return-fetch-btn">
                {fetchingReceipt ? 'Fetching...' : 'Fetch'}
              </button>
            </div>
            {fetchError && <div className="error mb-2 return-error">{fetchError}</div>}
            {receipt && (
              <div className="mt-4 return-items-list">
                <h3 className="mb-2">Select items to return:</h3>
                <table className="w-full text-left mb-2 return-table">
                  <thead>
                    <tr className="text-text-secondary">
                      <th></th>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.items.map((item, idx) => (
                      <tr key={idx} className={item.returned ? 'returned-row' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(idx)}
                            onChange={() => handleToggleItem(idx)}
                            disabled={item.returned}
                            className="return-checkbox"
                          />
                        </td>
                        <td>{item.name}</td>
                        <td>{item.qty}</td>
                        <td>${item.price.toFixed(2)}</td>
                        <td>
                          {item.returned ? (
                            <span className="error returned-label">Returned</span>
                          ) : (
                            <span className="success available-label">Available</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  className="pay-btn return-submit-btn"
                  onClick={handleSubmitReturn}
                  disabled={selectedItems.length === 0 || submitting}
                >
                  {submitting ? 'Processing...' : 'Submit Return'}
                </button>
              </div>
            )}
            <button className="close-btn return-close-btn" onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
      {/* Return Receipt Modal */}
      {showReturnModal && returnReceipt && (
        <div className="modal-overlay return-modal-overlay">
          <div className="modal-content return-modal-content">
            <div className="sales-receipt return-receipt" id="return-receipt-to-download">
              <h2 className="receipt-title">Return Receipt</h2>
              <div className="receipt-meta mb-2 text-text-secondary">{returnReceipt.time}</div>
              <div className="receipt-billno mb-2 font-bold">Bill No: {returnReceipt.billNo}</div>
              <table className="receipt-table w-full text-left mb-2">
                <thead>
                  <tr className="text-text-secondary">
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {returnReceipt.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td>{item.qty}</td>
                      <td>${item.price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="receipt-summary summary">
                <div>Original Purchase Date: <span>{returnReceipt.originalTime}</span></div>
                <div>Mint Tx Hash: <span style={{fontFamily:'monospace'}}>{returnReceipt.mintTxHash}</span></div>
              </div>
              <div className="receipt-actions">
                <button
                  onClick={() => {
                    const element = document.getElementById('return-receipt-to-download');
                    const opt = {
                      margin: 1,
                      filename: `return_receipt_${returnReceipt.billNo}.pdf`,
                      image: { type: 'jpeg', quality: 0.98 },
                      html2canvas: { scale: 2 },
                      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                    };
                    html2pdf().from(element).set(opt).save();
                  }}
                  className="download-btn return-download-btn"
                >
                  Download Return Receipt
                </button>
                <button
                  onClick={handleChangeToCoupon}
                  className="pay-btn return-submit-btn"
                  style={{marginLeft: '0.5rem', background: '#6366f1'}}
                >
                  Change to Coupon
                </button>
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="close-btn return-close-btn"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Coupon Modal */}
      {showCouponModal && (
        <div className="modal-overlay return-modal-overlay">
          <div className="modal-content return-modal-content" style={{maxWidth: '400px'}}>
            <h2 className="mb-3 return-modal-title">Mint Coupon</h2>
            <div className="mb-2">Enter Coupon Contract Address:</div>
            <input
              className="input-field return-input mb-3"
              type="text"
              placeholder="0x..."
              value={couponContract}
              onChange={e => setCouponContract(e.target.value)}
            />
            <div className="mb-2">Enter Coupon Owner Wallet Address:</div>
            <input
              className="input-field return-input mb-3"
              type="text"
              placeholder="0x..."
              value={couponOwner}
              onChange={e => setCouponOwner(e.target.value)}
            />
            {couponError && <div className="error mb-2 return-error">{couponError}</div>}
            <button
              className="pay-btn return-submit-btn"
              onClick={handleMintCoupon}
              disabled={!couponContract || !ethers.isAddress(couponOwner) || !ethers.isAddress(couponContract) || mintingCoupon}
            >
              {mintingCoupon ? 'Minting...' : 'Mint Coupon'}
            </button>
            <button className="close-btn return-close-btn" onClick={() => setShowCouponModal(false)} style={{marginLeft:'0.5rem'}}>Cancel</button>
          </div>
        </div>
      )}
      {/* Coupon Details Modal */}
      {couponDetails && (
        <div className="modal-overlay return-modal-overlay">
          <div className="modal-content return-modal-content" style={{maxWidth: '400px'}}>
            <h2 className="mb-3 return-modal-title">Coupon Minted!</h2>
            <div className="mb-2"><b>Coupon Code:</b> {couponDetails.couponCode}</div>
            <div className="mb-2"><b>Value:</b> ${couponDetails.value.toFixed(2)}</div>
            <div className="mb-2"><b>Expiry:</b> {couponDetails.expiry}</div>
            <div className="mb-2"><b>Return Bill No:</b> {couponDetails.returnBillNo}</div>
            <div className="mb-2"><b>Contract:</b> <span className="mono">{couponDetails.contract}</span></div>
            <div className="mb-2"><b>Mint Tx Hash:</b> <span className="mono">{couponDetails.mintTxHash}</span></div>
            <div className="mb-2"><b>Token ID:</b> <span className="mono">{couponDetails.tokenId}</span></div>
            <div className="mb-2"><b>Token URI:</b> <span className="mono">{couponDetails.tokenURI}</span></div>
            <button className="close-btn return-close-btn" onClick={() => setCouponDetails(null)}>Close</button>
          </div>
        </div>
      )}
      {/* Expanded Return Modal */}
      {selectedReturn && (
        <div className="modal-overlay return-modal-overlay">
          <div className="modal-content return-modal-content" style={{maxWidth: '600px'}}>
            <h2 className="mb-3 return-modal-title">Return Details</h2>
            <div className="mb-2"><b>Return Bill No:</b> {selectedReturn.returnBillNo}</div>
            <div className="mb-2"><b>Purchase Bill No:</b> {selectedReturn.billNo}</div>
            <div className="mb-2"><b>Purchase Date:</b> {selectedReturn.originalTime}</div>
            <div className="mb-2"><b>Return Date:</b> {selectedReturn.time}</div>
            <div className="mb-2"><b>Return Hash:</b> <span className="mono">{selectedReturn.mintTxHash}</span></div>
            <div className="mb-2"><b>Returned Items:</b></div>
            <table className="return-card-items-table mb-3">
              <thead>
                <tr><th>Product</th><th>Qty</th><th>Price</th></tr>
              </thead>
              <tbody>
                {selectedReturn.items && selectedReturn.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td>{item.qty}</td>
                    <td>${item.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="close-btn return-close-btn" onClick={() => setSelectedReturn(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Returns; 