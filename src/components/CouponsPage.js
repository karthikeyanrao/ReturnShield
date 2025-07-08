import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CouponNFTABI from '../contracts/CouponNFT.json';
import CouponMint from './CouponMint';

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
  }, [showMint]); // refetch after mint

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-accent-primary">Coupons</h1>
        <button
          onClick={() => setShowMint(true)}
          className="py-2 px-4 rounded-lg bg-accent-primary hover:bg-accent-secondary text-button-cta-text font-semibold text-base"
        >
          New Coupon
        </button>
      </div>
      {showMint && <CouponMint onCancel={() => setShowMint(false)} />}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
        </div>
      ) : (
        <div className="bg-background-card rounded shadow-custom p-4 border border-default mt-6">
          <table className="w-full text-left text-text-primary">
            <thead>
              <tr className="text-text-secondary">
                <th>Coupon Code</th>
                <th>Value</th>
                <th>Expiry</th>
                <th>Hash Value</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(coupon => (
                <tr key={coupon.id} className="border-b border-default last:border-0">
                  <td>{coupon.couponCode || '-'}</td>
                  <td>{coupon.value || '-'}</td>
                  <td>{coupon.expiry ? new Date(coupon.expiry.seconds ? coupon.expiry.seconds * 1000 : coupon.expiry).toLocaleDateString() : '-'}</td>
                  <td>{coupon.hash ? <a href={`https://sepolia.etherscan.io/tx/${coupon.hash}`} target="_blank" rel="noopener noreferrer">{coupon.hash.slice(0, 10)}...</a> : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CouponsPage; 