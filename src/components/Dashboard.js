import React, { useState, useEffect } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
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
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

Chart.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, TimeScale);

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
  const [inventory, setInventory] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [dismissedLowStock, setDismissedLowStock] = useState([]);
  const [editingStock, setEditingStock] = useState({}); // { [itemId]: true/false }
  const [stockInputs, setStockInputs] = useState({}); // { [itemId]: value }
  const [salesChartData, setSalesChartData] = useState(null);
  const [inventoryChartData, setInventoryChartData] = useState(null);
  const [couponChartData, setCouponChartData] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      // Fetch all data from Firestore
      const [receiptsSnap, couponsSnap, returnsSnap, inventorySnap] = await Promise.all([
        getDocs(collection(db, 'receipts')),
        getDocs(collection(db, 'coupons')),
        getDocs(collection(db, 'returns')),
        getDocs(collection(db, 'inventory')),
      ]);
      const receipts = receiptsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const coupons = couponsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const returns = returnsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const inventoryData = inventorySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInventory(inventoryData);
      // Low stock items
      const lowStock = inventoryData.filter(item => item.qty < 10);
      setLowStockItems(lowStock);
      // Sales over time (by day)
      const salesByDate = {};
      receipts.forEach(r => {
        const date = r.time ? new Date(r.time).toLocaleDateString() : 'Unknown';
        salesByDate[date] = (salesByDate[date] || 0) + (r.total || 0);
      });
      const salesDates = Object.keys(salesByDate).sort((a, b) => new Date(a) - new Date(b));
      setSalesChartData({
        labels: salesDates,
        datasets: [{
          label: 'Sales ($)',
          data: salesDates.map(d => salesByDate[d]),
          backgroundColor: '#2563eb',
        }],
      });
      // Inventory trends (current stock)
      setInventoryChartData({
        labels: inventoryData.map(i => i.name),
        datasets: [{
          label: 'Stock',
          data: inventoryData.map(i => i.qty),
          backgroundColor: '#22c55e',
        }],
      });
      // Coupon usage (by month)
      const couponByMonth = {};
      coupons.forEach(c => {
        let date = c.createdAt && c.createdAt.toDate ? c.createdAt.toDate() : (c.created ? new Date(c.created) : new Date());
        const month = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}`;
        couponByMonth[month] = (couponByMonth[month] || 0) + 1;
      });
      const couponMonths = Object.keys(couponByMonth).sort();
      setCouponChartData({
        labels: couponMonths,
        datasets: [{
          label: 'Coupons Minted',
          data: couponMonths.map(m => couponByMonth[m]),
          backgroundColor: '#f59e42',
        }],
      });
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

  // Update stock handler
  const handleUpdateStock = async (itemId) => {
    const newQty = parseInt(stockInputs[itemId]);
    if (isNaN(newQty) || newQty < 0) return;
    // Update in Firebase
    const itemRef = doc(db, 'inventory', itemId);
    await updateDoc(itemRef, { qty: newQty });
    // Refresh inventory
    const inventorySnap = await getDocs(collection(db, 'inventory'));
    const inventoryData = inventorySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setInventory(inventoryData);
    setEditingStock({ ...editingStock, [itemId]: false });
    setStockInputs({ ...stockInputs, [itemId]: '' });
    // Update low stock items
    setLowStockItems(inventoryData.filter(item => item.qty < 10 && !dismissedLowStock.includes(item.id)));
  };

  // Dismiss notification handler
  const handleDismissLowStock = (itemId) => {
    setDismissedLowStock(prev => [...prev, itemId]);
    setLowStockItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleGoToInventory = () => {
    navigate('/inventory');
  };

  // Chart gradient plugin
  const getBarGradient = (ctx, chartArea) => {
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, '#2563eb');
    gradient.addColorStop(1, '#60a5fa');
    return gradient;
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#23232b',
        titleColor: '#fff',
        bodyColor: '#f59e42',
        borderColor: '#2563eb',
        borderWidth: 1,
        padding: 12,
        caretSize: 8,
        displayColors: false,
      },
    },
    animation: {
      duration: 1200,
      easing: 'easeOutBounce',
    },
    elements: {
      bar: {
        borderRadius: 12,
        backgroundColor: function(context) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return '#2563eb';
          return getBarGradient(ctx, chartArea);
        },
        borderSkipped: false,
        hoverBackgroundColor: '#f59e42',
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#2563eb', font: { weight: 600 } },
      },
      y: {
        grid: { color: '#e5e7eb' },
        ticks: { color: '#18181b', font: { weight: 600 } },
      },
    },
  };

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
      {/* Low Stock Notification */}
      {lowStockItems.length > 0 && (
        <div style={{background:'#fff3cd',color:'#856404',border:'1px solid #ffeeba',borderRadius:8,padding:'1rem',marginBottom:'1.5rem',fontWeight:600,boxShadow:'0 4px 24px #f59e4280',animation:'fadeIn 0.7s'}}>
          <span style={{marginRight:8}}><AlertTriangle style={{display:'inline',verticalAlign:'middle'}} /></span>
          <span>Low Stock Alert: </span>
          {lowStockItems.map(item => (
            <span key={item.id} style={{marginRight:18,display:'inline-block'}}>
              {item.name} ({item.qty} left)
              {editingStock[item.id] ? (
                <>
                  <input
                    type="number"
                    value={stockInputs[item.id] || ''}
                    onChange={e => setStockInputs({ ...stockInputs, [item.id]: e.target.value })}
                    style={{marginLeft:8,width:60,padding:'2px 6px',borderRadius:4,border:'1px solid #ccc'}}
                  />
                  <button style={{marginLeft:6,background:'#22c55e',color:'#fff',border:'none',borderRadius:4,padding:'2px 10px',fontWeight:600,cursor:'pointer'}} onClick={() => handleUpdateStock(item.id)}>Save</button>
                  <button style={{marginLeft:6,background:'#f59e42',color:'#fff',border:'none',borderRadius:4,padding:'2px 10px',fontWeight:600,cursor:'pointer'}} onClick={() => setEditingStock({...editingStock,[item.id]:false})}>Cancel</button>
                </>
              ) : (
                <>
                  <button style={{marginLeft:8,background:'#2563eb',color:'#fff',border:'none',borderRadius:4,padding:'2px 10px',fontWeight:600,cursor:'pointer'}} onClick={handleGoToInventory}>Update Stock</button>
                  <button style={{marginLeft:6,background:'#ef4444',color:'#fff',border:'none',borderRadius:4,padding:'2px 10px',fontWeight:600,cursor:'pointer'}} onClick={() => handleDismissLowStock(item.id)}>Close</button>
                </>
              )}
            </span>
          ))}
        </div>
      )}
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
      {/* Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        <div className="card p-4 animated-card">
          <h3 className="font-semibold text-text-primary mb-2">Sales Over Time</h3>
          {salesChartData && <Bar data={salesChartData} options={chartOptions} />}
        </div>
        <div className="card p-4 animated-card">
          <h3 className="font-semibold text-text-primary mb-2">Inventory Stock</h3>
          {inventoryChartData && <Bar data={inventoryChartData} options={chartOptions} />}
        </div>
        <div className="card p-4 animated-card">
          <h3 className="font-semibold text-text-primary mb-2">Coupon Usage</h3>
          {couponChartData && <Bar data={couponChartData} options={chartOptions} />}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-20px);} to { opacity: 1; transform: none; } }
        .animated-card { animation: fadeIn 0.8s cubic-bezier(.4,2,.3,1) both; box-shadow: 0 4px 32px #2563eb22; transition: box-shadow 0.3s; }
        .animated-card:hover { box-shadow: 0 8px 48px #2563eb44; }
      `}</style>
    </div>
  );
};

export default Dashboard; 