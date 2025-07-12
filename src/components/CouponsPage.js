import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CouponMint from './CouponMint';
import './CouponPage.css';

const COUPON_CONTRACT_ADDRESS = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';

const CouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState('');
  const [showMint, setShowMint] = useState(false);

  useEffect(() => {
    const fetchCoupons = async () => {
      setLoading(true);
      try {
        // Fetch all coupons from Firestore
        const q = await import('../firebase').then(m => m.db).then(db => import('firebase/firestore').then(fb => fb.getDocs(fb.collection(db, 'coupons'))));
        const snapshot = await q;
        const couponsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCoupons(couponsData);
      } catch (err) {
        setCoupons([]);
      }
      setLoading(false);
    };
    fetchCoupons();
  }, [showMint]); 

  // Helper function to get hash value (check both 'hash' and 'mintTxHash' fields)
  const getHashValue = (coupon) => {
    return coupon.hash || coupon.mintTxHash || '-';
  };

  // Helper function to check if coupon is expired
  const isExpired = (expiry) => {
    if (!expiry) return false;
    const expiryDate = expiry.seconds ? new Date(expiry.seconds * 1000) : new Date(expiry);
    return expiryDate < new Date();
  };

  // Helper function to format expiry date
  const formatExpiryDate = (expiry) => {
    if (!expiry) return '-';
    const expiryDate = expiry.seconds ? new Date(expiry.seconds * 1000) : new Date(expiry);
    return expiryDate.toLocaleDateString();
  };

  return (
    <div className="coupons-container">
      <div className="coupons-header">
        <h1 className="coupons-title">Coupons</h1>
        <button
          onClick={() => setShowMint(true)}
          className="new-coupon-btn"
        >
          + New Coupon
        </button>
      </div>
      
      {showMint && <CouponMint onCancel={() => setShowMint(false)} />}
      
      <div className="coupons-content">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        ) : coupons.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎫</div>
            <div className="empty-state-text">No coupons found</div>
            <div className="empty-state-subtext">Create your first coupon to get started</div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="coupons-table-container">
              <table className="coupons-table">
                <thead>
                  <tr>
                    <th>Coupon Code</th>
                    <th>Value</th>
                    <th>Expiry</th>
                    <th>Status</th>
                    <th>Transaction Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(coupon => (
                    <tr key={coupon.id}>
                      <td>
                        <span className="coupon-code">{coupon.couponCode || '-'}</span>
                      </td>
                      <td>
                        <span className="coupon-value">${coupon.value ? parseFloat(coupon.value).toFixed(2) : '-'}</span>
                      </td>
                      <td>
                        <span className="coupon-expiry">{formatExpiryDate(coupon.expiry)}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${isExpired(coupon.expiry) ? 'status-expired' : 'status-active'}`}>
                          {isExpired(coupon.expiry) ? 'Expired' : 'Active'}
                        </span>
                      </td>
                      <td>
                        {getHashValue(coupon) !== '-' ? (
                          <a 
                            href={`https://sepolia.etherscan.io/tx/${getHashValue(coupon)}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="coupon-hash"
                          >
                            {getHashValue(coupon).slice(0, 10)}...{getHashValue(coupon).slice(-8)}
                          </a>
                        ) : (
                          <span className="coupon-expiry">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="coupons-cards">
              {coupons.map(coupon => (
                <div key={coupon.id} className="coupon-card">
                  <div className="coupon-card-header">
                    <span className="coupon-card-code">{coupon.couponCode || 'N/A'}</span>
                    <span className="coupon-card-value">${coupon.value ? parseFloat(coupon.value).toFixed(2) : '-'}</span>
                  </div>
                  <div className="coupon-card-details">
                    <div>Expiry: {formatExpiryDate(coupon.expiry)}</div>
                    <div>Status: 
                      <span className={`status-badge ${isExpired(coupon.expiry) ? 'status-expired' : 'status-active'}`}>
                        {isExpired(coupon.expiry) ? 'Expired' : 'Active'}
                      </span>
                    </div>
                    {getHashValue(coupon) !== '-' && (
                      <div>
                        <span className="coupon-card-hash">
                          <a 
                            href={`https://sepolia.etherscan.io/tx/${getHashValue(coupon)}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            View Transaction
                          </a>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CouponsPage; 