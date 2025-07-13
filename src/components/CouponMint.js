import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ethers } from 'ethers';
import CouponNFTABI from '../contracts/CouponNFT.json';
import { isAddress } from 'ethers';
import axios from 'axios';
import './CouponMint.css';
const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIzNDE3OGU2Yi1hYjc2LTRjZTUtODY3NC1hYjVjNDAwMGZiMDAiLCJlbWFpbCI6InJpcHBsZXNrYXJ0aGlAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjY4MGM0MDQ0YzcwMDkxN2NkNmI0Iiwic2NvcGVkS2V5U2VjcmV0IjoiNTc4ZDE1NjQwNThiZDJmMGYzZjdkYTkwZTFjMmM0ODcyMjZhM2MwMTExMjZjZjQ5MzI5Y2MxZmQ3YjhlZjczZCIsImV4cCI6MTc4MzQ5NjM2OH0.XLR9uHjDAuX13WVrJtOvzI_enVJDpqf1CBudq_6_Nr8';

function generateCouponCode(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const CouponMint = ({ onCancel }) => {
  const [form, setForm] = useState({ value: '', expiry: '', owner: '', contractAddress: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (!form.value || !form.expiry || !form.owner || !form.contractAddress) {
        setError('All fields are required.');
        setLoading(false);
        return;
      }
      if (!isAddress(form.owner)) {
        setError('Please enter a valid Ethereum address for the owner.');
        setLoading(false);
        return;
      }
      if (!isAddress(form.contractAddress)) {
        setError('Please enter a valid Ethereum contract address.');
        setLoading(false);
        return;
      }
      // Generate unique coupon code
      const couponCode = generateCouponCode();
      // Upload metadata to Pinata
      const tokenURI = await uploadMetadataToPinata({
        code: couponCode,
        value: form.value,
        expiry: form.expiry,
        imageUrl: '',
      });
      let txHash = '';
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const tx = await mintCouponOnChainWithTx({ to: form.owner, couponCode, tokenURI, value: form.value, expiry: form.expiry }, form.contractAddress, signer);
          txHash = tx.hash;
        } catch (walletErr) {
          setError('MetaMask/Wallet error: ' + (walletErr?.message || walletErr));
          setLoading(false);
          return;
        }
      } else {
        setError('MetaMask is not installed.');
        setLoading(false);
        return;
      }
      // Save couponCode, tokenURI, value, expiry, and txHash in Firestore
      await addDoc(collection(db, 'coupons'), {
        couponCode,
        tokenURI,
        value: parseFloat(form.value),
        expiry: new Date(form.expiry),
        hash: txHash,
        mintTxHash: txHash, // Store both for compatibility
        createdAt: new Date(),
        createdBy: 'admin',
      });
      setSuccess('Coupon created!');
      setForm({ value: '', expiry: '', owner: '', contractAddress: form.contractAddress });
    } catch (err) {
      setError('Failed to create coupon: ' + (err?.message || err));
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  return (
    <div className="coupon-mint-container">
      <h2 className="coupon-mint-title">Coupon Mint</h2>
      <form onSubmit={handleSubmit} className="coupon-mint-form">
        <div>
          <label>Value (USD)</label>
          <input name="value" type="number" value={form.value} onChange={handleChange} />
        </div>
        <div>
          <label>Expiry Date</label>
          <input name="expiry" type="date" value={form.expiry} onChange={handleChange} />
        </div>
        <div>
          <label>Owner Wallet Address</label>
          <input name="owner" value={form.owner} onChange={handleChange} />
        </div>
        <div>
          <label>Contract Address</label>
          <input name="contractAddress" value={form.contractAddress} onChange={handleChange} />
        </div>
        {error && <div className="text-status-alert">{error}</div>}
        {success && <div className="text-status-success">{success}</div>}
        <div className="flex gap-4">
          <button type="submit" disabled={loading} className="coupon-mint-btn">
            {loading ? 'Minting...' : 'Mint Coupon'}
          </button>
          <button type="button" onClick={onCancel} className="coupon-mint-cancel">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

async function mintCouponOnChainWithTx({ to, couponCode, tokenURI, value, expiry }, contractAddress, signer) {
  try {
    const contract = new ethers.Contract(contractAddress, CouponNFTABI.abi, signer);
    const tx = await contract.mintCoupon(to, couponCode, tokenURI);
    const receipt = await tx.wait();
    // Find the tokenId from the Transfer event
    const transferEvent = receipt.logs
      .map(log => contract.interface.parseLog(log))
      .find(e => e && e.name === 'Transfer');
    const tokenId = transferEvent ? transferEvent.args.tokenId.toString() : null;

    // Save couponCode, tokenId, etc. in Firestore
    await addDoc(collection(db, 'coupons'), {
      couponCode,
      tokenId,
      tokenURI,
      value: parseFloat(value),      // use value from arguments
      expiry: new Date(expiry),      // use expiry from arguments
      hash: tx.hash,
      mintTxHash: tx.hash, 
      createdAt: new Date(),
      createdBy: 'admin',
    });
    return tx;
  } catch (err) {
    throw err;
  }
}

export default CouponMint;
