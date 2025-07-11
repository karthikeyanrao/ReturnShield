import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AdminPanel.css';
import { 
  Settings, 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  DollarSign,
  BarChart3,
  FileText,
  Search,
  Filter,
  Calendar,
  Eye,
  Download,
  RefreshCw,
  Activity,
  Lock,
  Unlock,
  Tag,
  ShoppingCart
} from 'lucide-react';

const AdminPanel = ({ wallet: walletProp }) => {
  const [wallet, setWallet] = useState(walletProp || '');
  const sidebarLinks = [
    { to: '/', label: 'Dashboard', icon: BarChart3 },
    { to: '/coupons', label: 'Coupons', icon: Tag },
    { to: '/sales', label: 'Sales', icon: ShoppingCart },
    { to: '/returns', label: 'Returns Management', icon: FileText },
    
  ];
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWallet(accounts[0]);
        console.log('Connected wallet:', accounts[0]);
      } catch (err) {
        alert('Wallet connection failed: ' + (err?.message || err));
      }
    } else {
      alert('MetaMask is not installed.');
    }
  };

  const [stats, setStats] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const location = useLocation();

  useEffect(() => {
    const loadAdminData = async () => {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
    };

    loadAdminData();
  }, []);

 
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || log.action === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  // Only render the sidebar navigation for MainLayout
  return (
    <div>
      <div className="flex items-center mb-8 px-2">
        <Shield className="h-8 w-8 text-accent-primary mr-2" />
        <span className="text-xl font-bold text-text-primary">ReturnShield+</span>
      </div>
      <nav>
        <ul className="space-y-2">
          {sidebarLinks.map(link => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors font-medium text-base ${location.pathname === link.to ? 'bg-accent-primary/20 text-accent-primary' : 'text-text-secondary hover:bg-hover-blue/20 hover:text-accent-primary'}`}
              >
                <link.icon className="h-5 w-5 mr-3" />
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto px-2 text-xs text-text-muted">
        <button
          onClick={connectWallet}
          className="py-2 px-4 rounded bg-accent-secondary text-button-cta-text font-semibold"
        >
          {wallet ? `Connected: ${wallet.slice(0, 6)}...${wallet.slice(-4)}` : 'Connect Wallet'}
        </button></div>
    </div>
  );
};

export default AdminPanel; 