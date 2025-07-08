import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
// You may use a wallet connect library or mock for now
// import WalletConnect from './WalletConnect';

const connectWithMetaMask = async () => {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      return accounts[0];
    } catch (error) {
      throw new Error('User denied wallet connection');
    }
  } else {
    throw new Error('MetaMask is not installed');
  }
};

const Login = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setLoading(true);
    setError('');
    try {
      const walletAddress = await connectWithMetaMask();
      const sessionId = uuidv4();
      // Store session in Firestore
      await setDoc(doc(collection(db, 'sessions'), sessionId), {
        walletAddress,
        sessionId,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
      });
      // Store sessionId locally
      localStorage.setItem('sessionId', sessionId);
      localStorage.setItem('walletAddress', walletAddress);
      if (onLogin) onLogin({ walletAddress, sessionId });
    } catch (err) {
      setError(err.message || 'Failed to connect wallet.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
      <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-md flex flex-col items-center">
        <img src="/logo192.png" alt="ReturnShield Logo" className="w-20 mb-6" />
        <h2 className="text-2xl font-bold mb-2 text-indigo-700">Welcome to ReturnShield</h2>
        <p className="mb-6 text-gray-500">Sign in with your blockchain wallet to continue</p>
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg flex items-center justify-center transition"
        >
          {loading ? (
            <span className="loader mr-2"></span>
          ) : (
            <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 13v7m0 0l-7-4m7 4l7-4" /></svg>
          )}
          Connect Wallet
        </button>
        {error && <div className="mt-4 text-red-500">{error}</div>}
      </div>
    </div>
  );
};

export default Login; 