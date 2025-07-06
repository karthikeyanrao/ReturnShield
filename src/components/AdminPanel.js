import React, { useState, useEffect } from 'react';
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
  Unlock
} from 'lucide-react';

const AdminPanel = ({ wallet }) => {
  const [stats, setStats] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Admin Panel</h1>
        <p className="text-text-secondary">System administration and fraud prevention tools</p>
      </div>

      {/* Tab Navigation */}
      <div className="card">
        <div className="flex space-x-1">
          {[
            { id: 'overview', name: 'Overview', icon: BarChart3 },
            { id: 'audit', name: 'Audit Logs', icon: FileText },
            { id: 'fraud', name: 'Fraud Alerts', icon: AlertTriangle },
            { id: 'system', name: 'System Health', icon: Activity }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                selectedTab === tab.id
                  ? 'bg-accent-primary text-text-cta'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background-input'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Total Transactions</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.totalTransactions}</p>
                </div>
                <div className="p-3 bg-accent-primary/10 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-accent-primary" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Total Value</p>
                  <p className="text-2xl font-bold text-text-primary">{formatCurrency(stats.totalValue)}</p>
                </div>
                <div className="p-3 bg-status-success/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-status-success" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Fraud Attempts</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.fraudAttempts}</p>
                </div>
                <div className="p-3 bg-status-alert/10 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-status-alert" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Active Users</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.activeUsers}</p>
                </div>
                <div className="p-3 bg-accent-secondary/10 rounded-lg">
                  <Users className="h-6 w-6 text-accent-secondary" />
                </div>
              </div>
            </div>
          </div>

          {/* Fraud Prevention Stats */}
          <div className="card">
            <h3 className="font-semibold text-text-primary mb-4">Fraud Prevention Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-status-success mb-2">
                  {((stats.fraudPrevented / stats.fraudAttempts) * 100).toFixed(1)}%
                </div>
                <p className="text-text-secondary">Success Rate</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-status-alert mb-2">
                  {stats.fraudAttempts - stats.fraudPrevented}
                </div>
                <p className="text-text-secondary">Failed Attempts</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent-primary mb-2">
                  {formatCurrency(stats.totalValue * 0.05)}
                </div>
                <p className="text-text-secondary">Potential Loss Prevented</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {selectedTab === 'audit' && (
        <div className="space-y-6">
          {/* Search and Filter */}
          <div className="card">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10 w-full"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Actions</option>
                  <option value="RETURN_PROCESSED">Returns</option>
                  <option value="COUPON_REDEEMED">Coupons</option>
                  <option value="FRAUD_DETECTED">Fraud</option>
                  <option value="PURCHASE_TOKEN_CREATED">Purchases</option>
                </select>
                <button className="btn-secondary flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="card">
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-background-input rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getActionIcon(log.action)}
                    <div>
                      <p className="font-medium text-text-primary">{log.details}</p>
                      <p className="text-sm text-text-secondary">
                        {log.user} • {formatDate(log.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`font-semibold ${getStatusColor(log.status)}`}>
                      {log.amount !== 0 && formatCurrency(log.amount)}
                    </span>
                    <span className={`text-sm font-medium ${getStatusColor(log.status)}`}>
                      {log.status.toUpperCase()}
                    </span>
                    <button className="p-1 hover:bg-background-card rounded">
                      <Eye className="h-4 w-4 text-text-muted" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fraud Alerts Tab */}
      {selectedTab === 'fraud' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary">Active Fraud Alerts</h3>
              <button className="btn-secondary flex items-center space-x-2">
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {fraudAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 bg-background-input rounded-lg border-l-4 border-status-alert">
                  <div className="flex items-center space-x-4">
                    <AlertTriangle className="h-5 w-5 text-status-alert" />
                    <div>
                      <p className="font-medium text-text-primary">{alert.description}</p>
                      <p className="text-sm text-text-secondary">
                        {alert.user} • {formatDate(alert.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`text-sm font-medium ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className={`text-sm font-medium ${getStatusColor(alert.status)}`}>
                      {alert.status.toUpperCase()}
                    </span>
                    <button className="btn-secondary">
                      Investigate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* System Health Tab */}
      {selectedTab === 'system' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold text-text-primary mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Overall Health</span>
                  <span className="text-status-success font-semibold">{stats.systemHealth}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Blockchain Connection</span>
                  <span className="text-status-success font-semibold">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Smart Contracts</span>
                  <span className="text-status-success font-semibold">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">API Services</span>
                  <span className="text-status-success font-semibold">Online</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-text-primary mb-4">Security Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Multi-Signature</span>
                  <Lock className="h-4 w-4 text-status-success" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Fraud Detection</span>
                  <Lock className="h-4 w-4 text-status-success" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Audit Logging</span>
                  <Lock className="h-4 w-4 text-status-success" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Encryption</span>
                  <Lock className="h-4 w-4 text-status-success" />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-text-primary mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="btn-secondary flex items-center justify-center space-x-2">
                <RefreshCw className="h-4 w-4" />
                <span>Sync Blockchain</span>
              </button>
              <button className="btn-secondary flex items-center justify-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Export Data</span>
              </button>
              <button className="btn-secondary flex items-center justify-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>System Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel; 