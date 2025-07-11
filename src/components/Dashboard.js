import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Receipt, 
  Tag, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  DollarSign,
  ShoppingCart
} from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPurchases: 0,
    activeCoupons: 0,
    totalReturns: 0,
    fraudPrevented: 0,
    totalValue: 0,
    recentTransactions: []
  });

  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState('');
  const navigate = useNavigate();
  const [showAllModal, setShowAllModal] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      // Fetch all data from Firestore
      const [receiptsSnap, couponsSnap, returnsSnap] = await Promise.all([
        getDocs(collection(db, 'receipts')),
        getDocs(collection(db, 'coupons')),
        getDocs(collection(db, 'returns')),
      ]);
      const receipts = receiptsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const coupons = couponsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const returns = returnsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Calculate stats
      const now = new Date();
      const activeCoupons = coupons.filter(c => {
        if (!c.expiry) return false;
        let expiryDate;
        if (c.expiry instanceof Date) {
          expiryDate = c.expiry;
        } else if (c.expiry && c.expiry.toDate) {
          expiryDate = c.expiry.toDate();
        } else {
          expiryDate = new Date(c.expiry);
        }
        // Include today as active
        return expiryDate >= new Date(now.toDateString());
      }).length;
      const totalValue = receipts.reduce((sum, r) => sum + (r.total || 0), 0);
      // Recent transactions: purchases, returns, coupons
      const recentPurchases = receipts.map(r => ({
        id: r.id,
        type: 'purchase',
        amount: r.total || 0,
        item: r.billNo || 'Purchase',
        timestamp: r.time ? new Date(r.time) : new Date(),
        status: 'completed',
      }));
      const recentReturns = returns.map(r => ({
        id: r.id,
        type: 'return',
        amount: -1 * (r.items ? r.items.reduce((sum, i) => sum + (i.price * i.qty), 0) : 0),
        item: r.returnBillNo || 'Return',
        timestamp: r.time ? new Date(r.time) : new Date(),
        status: 'approved',
      }));
      const recentCoupons = coupons.map(c => ({
        id: c.id,
        type: 'coupon',
        amount: -1 * (c.value || 0),
        item: 'Coupon', // Always show as 'Coupon'
        timestamp: c.createdAt && c.createdAt.toDate ? c.createdAt.toDate() : (c.created ? new Date(c.created) : new Date()),
        status: 'minted',
      }));
      // Combine and sort by timestamp desc
      const recentTransactions = [...recentPurchases, ...recentReturns, ...recentCoupons]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);
      setStats({
        totalPurchases: receipts.length,
        activeCoupons,
        totalReturns: returns.length,
        totalValue,
        recentTransactions,
      });
      setLoading(false);
    };
    loadDashboardData();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-status-success" />;
      case 'used':
        return <Tag className="h-4 w-4 text-accent-secondary" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-status-success" />;
      default:
        return <Clock className="h-4 w-4 text-status-warning" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'purchase':
        return <ShoppingCart className="h-4 w-4 text-accent-primary" />;
      case 'coupon':
        return <Tag className="h-4 w-4 text-accent-secondary" />;
      case 'return':
        return <Users className="h-4 w-4 text-status-warning" />;
      default:
        return <Receipt className="h-4 w-4 text-text-secondary" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatTime = (timestamp) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.floor((timestamp - Date.now()) / (1000 * 60 * 60)),
      'hour'
    );
  };

 
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Dashboard</h1>
        <p className="text-text-secondary">Welcome to ReturnShield+ - Your fraud prevention overview</p>
        
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Total Purchases</p>
              <p className="text-2xl font-bold text-text-primary">{stats.totalPurchases}</p>
            </div>
            <div className="p-3 bg-accent-primary/10 rounded-lg">
              <Receipt className="h-6 w-6 text-accent-primary" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Active Coupons</p>
              <p className="text-2xl font-bold text-text-primary">{stats.activeCoupons}</p>
            </div>
            <div className="p-3 bg-accent-secondary/10 rounded-lg">
              <Tag className="h-6 w-6 text-accent-secondary" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Total Returns</p>
              <p className="text-2xl font-bold text-text-primary">{stats.totalReturns}</p>
            </div>
            <div className="p-3 bg-status-warning/10 rounded-lg">
              <Users className="h-6 w-6 text-status-warning" />
            </div>
          </div>
        </div>
      </div>
      {/* Value and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Total Value */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <DollarSign className="h-5 w-5 text-status-success" />
            <h3 className="font-semibold text-text-primary">Total Value</h3>
          </div>
          <p className="text-3xl font-bold text-text-primary mb-2">
            {formatCurrency(stats.totalValue)}
          </p>
          <div className="flex items-center space-x-2 text-sm text-text-secondary">
            <TrendingUp className="h-4 w-4 text-status-success" />
            <span>+23.06% from last month</span>
          </div>
        </div>
        {/* Recent Transactions */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">Recent Transactions</h3>
            <button className="text-sm text-accent-primary hover:text-accent-hover" onClick={() => setShowAllModal(true)}>
              View All
            </button>
          </div>
          <div className="space-y-3">
            {stats.recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-background-input rounded-lg">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(transaction.type)}
                  <div>
                    <p className="font-medium text-text-primary">{transaction.item}</p>
                    <p className="text-sm text-text-secondary">
                      {formatTime(transaction.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`font-semibold ${
                    transaction.amount > 0 ? 'text-status-success' : 'text-status-warning'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                  </span>
                  {getStatusIcon(transaction.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="font-semibold text-text-primary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 bg-background-input hover:bg-border-default rounded-lg transition-colors duration-200" onClick={() => navigate('/sales')}>
            <Receipt className="h-5 w-5 text-accent-primary" />
            <span className="text-text-primary">Sales</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-background-input hover:bg-border-default rounded-lg transition-colors duration-200" onClick={() => navigate('/coupons')}>
            <Tag className="h-5 w-5 text-accent-secondary" />
            <span className="text-text-primary">Manage Coupons</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-background-input hover:bg-border-default rounded-lg transition-colors duration-200" onClick={() => navigate('/returns')}>
            <Users className="h-5 w-5 text-status-warning" />
            <span className="text-text-primary">Process Returns</span>
          </button>
        </div>
      </div>
      {/* View All Modal */}
      {showAllModal && (
        <div className="modal-overlay return-modal-overlay">
          <div className="modal-content return-modal-content" style={{maxWidth: '600px'}}>
            <h2 className="mb-3 return-modal-title">All Recent Transactions</h2>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {[...stats.recentTransactions].sort((a, b) => b.timestamp - a.timestamp).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-background-input rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(transaction.type)}
                    <div>
                      <p className="font-medium text-text-primary">{transaction.item}</p>
                      <p className="text-sm text-text-secondary">
                        {formatTime(transaction.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`font-semibold ${
                      transaction.amount > 0 ? 'text-status-success' : 'text-status-warning'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </span>
                    {getStatusIcon(transaction.status)}
                  </div>
                </div>
              ))}
            </div>
            <button className="close-btn return-close-btn mt-4" onClick={() => setShowAllModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 