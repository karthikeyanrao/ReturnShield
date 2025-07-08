import React, { useState, useEffect } from 'react';
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
import { Link, useLocation } from 'react-router-dom';

const sidebarLinks = [
  { to: '/', label: 'Dashboard', icon: BarChart3 },
  { to: '/coupons', label: 'Coupons', icon: Tag },
  { to: '/sales', label: 'Sales', icon: ShoppingCart },
  { to: '/returns', label: 'Returns Management', icon: FileText },
  { to: '/admin', label: 'System Health', icon: Activity },
];

const AdminPanel = ({ wallet }) => {
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
      
      // Mock data - in real app this would come from blockchain/smart contracts
      setStats({
        totalTransactions: 1247,
        totalValue: 45678.90,
        fraudAttempts: 23,
        fraudPrevented: 21,
        activeUsers: 892,
        systemHealth: 'excellent'
      });

      setAuditLogs([
        {
          id: '1',
          timestamp: new Date('2024-01-20T10:30:00'),
          action: 'RETURN_PROCESSED',
          user: '0x1234...5678',
          details: 'Return approved for Gaming Laptop',
          amount: 1299.99,
          status: 'success'
        },
        {
          id: '2',
          timestamp: new Date('2024-01-20T09:15:00'),
          action: 'COUPON_REDEEMED',
          user: '0x8765...4321',
          details: 'Coupon SAVE20 used for Electronics purchase',
          amount: -25.00,
          status: 'success'
        },
        {
          id: '3',
          timestamp: new Date('2024-01-20T08:45:00'),
          action: 'FRAUD_DETECTED',
          user: '0xabcd...efgh',
          details: 'Duplicate return attempt detected',
          amount: 0,
          status: 'blocked'
        },
        {
          id: '4',
          timestamp: new Date('2024-01-20T08:00:00'),
          action: 'PURCHASE_TOKEN_CREATED',
          user: '0x9876...5432',
          details: 'New purchase token minted for Smart Watch',
          amount: 299.99,
          status: 'success'
        }
      ]);

      setFraudAlerts([
        {
          id: '1',
          type: 'duplicate_return',
          severity: 'high',
          user: '0xabcd...efgh',
          description: 'Multiple return attempts for same item',
          timestamp: new Date('2024-01-20T08:45:00'),
          status: 'resolved'
        },
        {
          id: '2',
          type: 'suspicious_activity',
          severity: 'medium',
          user: '0x1111...2222',
          description: 'Unusual purchase pattern detected',
          timestamp: new Date('2024-01-19T15:30:00'),
          status: 'investigating'
        },
        {
          id: '3',
          type: 'expired_coupon',
          severity: 'low',
          user: '0x3333...4444',
          description: 'Attempted to use expired coupon',
          timestamp: new Date('2024-01-19T12:15:00'),
          status: 'resolved'
        }
      ]);
      
      setLoading(false);
    };

    loadAdminData();
  }, []);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'text-status-alert';
      case 'medium':
        return 'text-status-warning';
      case 'low':
        return 'text-status-success';
      default:
        return 'text-text-secondary';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-status-success';
      case 'blocked':
        return 'text-status-alert';
      case 'investigating':
        return 'text-status-warning';
      case 'resolved':
        return 'text-status-success';
      default:
        return 'text-text-secondary';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'RETURN_PROCESSED':
        return <Users className="h-4 w-4" />;
      case 'COUPON_REDEEMED':
        return <DollarSign className="h-4 w-4" />;
      case 'FRAUD_DETECTED':
        return <AlertTriangle className="h-4 w-4" />;
      case 'PURCHASE_TOKEN_CREATED':
        return <Shield className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

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
      <div className="mt-auto px-2 text-xs text-text-muted">Wallet: {wallet}</div>
    </div>
  );
};

export default AdminPanel; 