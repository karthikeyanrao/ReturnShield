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

const Dashboard = ({ wallet }) => {
  const [stats, setStats] = useState({
    totalPurchases: 0,
    activeCoupons: 0,
    totalReturns: 0,
    fraudPrevented: 0,
    totalValue: 0,
    recentTransactions: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const loadDashboardData = async () => {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - in real app this would come from blockchain/smart contracts
      setStats({
        totalPurchases: 156,
        activeCoupons: 23,
        totalReturns: 12,
        fraudPrevented: 8,
        totalValue: 2847.50,
        recentTransactions: [
          {
            id: 1,
            type: 'purchase',
            amount: 299.99,
            item: 'Gaming Laptop',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            status: 'completed'
          },
          {
            id: 2,
            type: 'coupon',
            amount: -25.00,
            item: '20% Off Electronics',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            status: 'used'
          },
          {
            id: 3,
            type: 'return',
            amount: -89.99,
            item: 'Wireless Headphones',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
            status: 'approved'
          },
          {
            id: 4,
            type: 'purchase',
            amount: 149.99,
            item: 'Smart Watch',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
            status: 'completed'
          }
        ]
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary">Welcome to ReturnShield+ - Your fraud prevention overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Fraud Prevented</p>
              <p className="text-2xl font-bold text-text-primary">{stats.fraudPrevented}</p>
            </div>
            <div className="p-3 bg-status-success/10 rounded-lg">
              <Shield className="h-6 w-6 text-status-success" />
            </div>
          </div>
        </div>
      </div>

      {/* Value and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
            <span>+12.5% from last month</span>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">Recent Transactions</h3>
            <button className="text-sm text-accent-primary hover:text-accent-hover">
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
      <div className="card">
        <h3 className="font-semibold text-text-primary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 bg-background-input hover:bg-border-default rounded-lg transition-colors duration-200">
            <Receipt className="h-5 w-5 text-accent-primary" />
            <span className="text-text-primary">View Purchase Tokens</span>
          </button>
          
          <button className="flex items-center space-x-3 p-4 bg-background-input hover:bg-border-default rounded-lg transition-colors duration-200">
            <Tag className="h-5 w-5 text-accent-secondary" />
            <span className="text-text-primary">Manage Coupons</span>
          </button>
          
          <button className="flex items-center space-x-3 p-4 bg-background-input hover:bg-border-default rounded-lg transition-colors duration-200">
            <Users className="h-5 w-5 text-status-warning" />
            <span className="text-text-primary">Process Returns</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 