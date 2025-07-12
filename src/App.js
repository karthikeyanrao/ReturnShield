import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { Shield, Wallet, Receipt, Tag, Users, Settings, LogOut, Menu, X } from 'lucide-react';
import Dashboard from './components/Dashboard';
import WalletConnect from './components/WalletConnect';
import Returns from './components/Returns';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import CouponsPage from './components/CouponsPage';
import SalesPage from './components/SalesPage';
import InventoryPage from './components/InventoryPage';
import { db } from './firebase';
import { doc, getDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import MainLayout from './components/MainLayout';

const SESSION_TIMEOUT_MINUTES = 15;

function useSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        setSession(null);
        setLoading(false);
        return;
      }
      const sessionRef = doc(db, 'sessions', sessionId);
      const sessionSnap = await getDoc(sessionRef);
      if (!sessionSnap.exists()) {
        localStorage.removeItem('sessionId');
        setSession(null);
        setLoading(false);
        return;
      }
      const data = sessionSnap.data();
      const lastActive = data.lastActive?.toDate ? data.lastActive.toDate() : new Date();
      const now = new Date();
      const diff = (now - lastActive) / 1000 / 60;
      if (diff > SESSION_TIMEOUT_MINUTES) {
        // Session expired
        await deleteDoc(sessionRef);
        localStorage.removeItem('sessionId');
        setSession(null);
        setLoading(false);
        return;
      }
      // Update lastActive
      await updateDoc(sessionRef, { lastActive: serverTimestamp() });
      setSession(data);
      setLoading(false);
    };
    checkSession();
    // Optionally, set up interval to check session periodically
    // const interval = setInterval(checkSession, 60000);
    // return () => clearInterval(interval);
  }, []);

  return { session, loading, setSession };
}

function App() {
  const [wallet, setWallet] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if MetaMask is installed
  const checkIfWalletIsConnected = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          setWallet(signer);
          setIsConnected(true);
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    setLoading(true);
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        setWallet(signer);
        setIsConnected(true);
      } else {
        alert('Please install MetaMask!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setWallet(null);
    setIsConnected(false);
  };

  // Listen for account changes
  useEffect(() => {
    checkIfWalletIsConnected();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          checkIfWalletIsConnected();
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Shield },
    { name: 'Purchase Tokens', href: '/purchases', icon: Receipt },
    { name: 'Coupon Tokens', href: '/coupons', icon: Tag },
    { name: 'Returns', href: '/returns', icon: Users },
    { name: 'Admin Panel', href: '/admin', icon: Settings },
  ];

  if (!isConnected) {
    return <WalletConnect onConnect={connectWallet} loading={loading} />;
  }

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

function AppRoutes() {
  const { session, loading, setSession } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate('/login');
    }
  }, [loading, session, navigate]);

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={s => { setSession(s); navigate('/'); }} />} />
      <Route element={session ? <MainLayout /> : <Navigate to="/login" />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/coupons" element={<CouponsPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/returns" element={<Returns />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/inventory" element={<InventoryPage />} />
      </Route>
    </Routes>
  );
}

export default App;
