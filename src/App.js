import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { Shield, Wallet, Receipt, Tag, Users, Settings, LogOut, Menu, X } from 'lucide-react';
import Dashboard from './components/Dashboard';
import WalletConnect from './components/WalletConnect';
import PurchaseTokens from './components/PurchaseTokens';
import CouponTokens from './components/CouponTokens';
import Returns from './components/Returns';
import AdminPanel from './components/AdminPanel';

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
      <div className="min-h-screen bg-background-primary">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-background-card border-r border-border-default transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-0`}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-border-default">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-accent-primary" />
              <span className="text-xl font-bold text-text-primary">ReturnShield+</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-text-secondary hover:text-text-primary"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <nav className="mt-6 px-3">
            <div className="space-y-1">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-text-secondary hover:text-text-primary hover:bg-background-primary transition-colors duration-200"
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </a>
              ))}
            </div>
          </nav>

          {/* Wallet Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border-default">
            <div className="flex items-center space-x-2 mb-3">
              <Wallet className="h-4 w-4 text-accent-secondary" />
              <span className="text-sm font-medium text-text-secondary">Connected Wallet</span>
            </div>
            <div className="text-xs text-text-muted mb-3 break-all">
              {wallet?.address}
            </div>
            <button
              onClick={disconnectWallet}
              className="flex items-center w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-primary rounded-md transition-colors duration-200"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:pl-64">
          {/* Top Bar */}
          <div className="sticky top-0 z-40 bg-background-card border-b border-border-default">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-text-secondary hover:text-text-primary"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              <div className="flex items-center space-x-4">
                <div className="hidden sm:block">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-status-success rounded-full"></div>
                    <span className="text-sm text-text-secondary">Connected to Ethereum</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <main className="p-4 sm:p-6 lg:p-8">
            <Routes>
              <Route path="/" element={<Dashboard wallet={wallet} />} />
              <Route path="/purchases" element={<PurchaseTokens wallet={wallet} />} />
              <Route path="/coupons" element={<CouponTokens wallet={wallet} />} />
              <Route path="/returns" element={<Returns wallet={wallet} />} />
              <Route path="/admin" element={<AdminPanel wallet={wallet} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-overlay-modal lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </Router>
  );
}

export default App;
