import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  QrCode, 
  Copy, 
  Download, 
  Search, 
  Filter,
  Calendar,
  DollarSign,
  Package,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

const PurchaseTokens = ({ wallet }) => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const loadPurchaseTokens = async () => {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - in real app this would come from blockchain/smart contracts
      setPurchases([
        {
          id: '0x1234...5678',
          tokenId: '1',
          item: 'Gaming Laptop',
          amount: 1299.99,
          purchaseDate: new Date('2024-01-15'),
          store: 'Walmart Supercenter #1234',
          status: 'active',
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        },
        {
          id: '0x8765...4321',
          tokenId: '2',
          item: 'Wireless Headphones',
          amount: 89.99,
          purchaseDate: new Date('2024-01-10'),
          store: 'Walmart Online',
          status: 'returned',
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        },
        {
          id: '0xabcd...efgh',
          tokenId: '3',
          item: 'Smart Watch',
          amount: 299.99,
          purchaseDate: new Date('2024-01-08'),
          store: 'Walmart Supercenter #5678',
          status: 'active',
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        },
        {
          id: '0x9876...5432',
          tokenId: '4',
          item: 'Bluetooth Speaker',
          amount: 79.99,
          purchaseDate: new Date('2024-01-05'),
          store: 'Walmart Online',
          status: 'expired',
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        }
      ]);
      setLoading(false);
    };

    loadPurchaseTokens();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-status-success" />;
      case 'returned':
        return <Clock className="h-4 w-4 text-status-warning" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-status-alert" />;
      default:
        return <Clock className="h-4 w-4 text-text-secondary" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-status-success';
      case 'returned':
        return 'text-status-warning';
      case 'expired':
        return 'text-status-alert';
      default:
        return 'text-text-secondary';
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
      day: 'numeric'
    }).format(date);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = purchase.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || purchase.status === filterStatus;
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
        <h1 className="text-2xl font-bold text-text-primary">Purchase Tokens</h1>
        <p className="text-text-secondary">Your blockchain-verified purchase receipts</p>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search by item or token ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="returned">Returned</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Purchase Tokens Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPurchases.map((purchase) => (
          <div key={purchase.id} className="card hover:border-accent-primary transition-colors duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-accent-primary" />
                <span className="text-sm font-medium text-text-secondary">Token #{purchase.tokenId}</span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(purchase.status)}
                <span className={`text-sm font-medium ${getStatusColor(purchase.status)}`}>
                  {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-text-primary mb-1">{purchase.item}</h3>
                <p className="text-sm text-text-secondary">{purchase.store}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-status-success" />
                  <span className="font-semibold text-text-primary">
                    {formatCurrency(purchase.amount)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-text-muted" />
                  <span className="text-sm text-text-secondary">
                    {formatDate(purchase.purchaseDate)}
                  </span>
                </div>
              </div>

              <div className="bg-background-input rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted font-mono">
                    {purchase.id}
                  </span>
                  <button
                    onClick={() => copyToClipboard(purchase.id)}
                    className="p-1 hover:bg-background-card rounded transition-colors duration-200"
                  >
                    <Copy className="h-3 w-3 text-text-muted" />
                  </button>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedPurchase(purchase);
                    setShowQR(true);
                  }}
                  className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                >
                  <QrCode className="h-4 w-4" />
                  <span>Show QR</span>
                </button>
                <button className="flex-1 btn-secondary flex items-center justify-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* QR Code Modal */}
      {showQR && selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-overlay-modal" onClick={() => setShowQR(false)}></div>
          <div className="card max-w-md w-full relative">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                QR Code - {selectedPurchase.item}
              </h3>
              <div className="bg-white p-4 rounded-lg mb-4">
                <img
                  src={selectedPurchase.qrCode}
                  alt="QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <p className="text-sm text-text-secondary mb-4">
                Scan this QR code at any Walmart store for instant verification
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowQR(false)}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
                <button
                  onClick={() => copyToClipboard(selectedPurchase.id)}
                  className="btn-primary flex-1"
                >
                  Copy Token ID
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredPurchases.length === 0 && (
        <div className="text-center py-12">
          <Receipt className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No purchase tokens found</h3>
          <p className="text-text-secondary">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Your purchase tokens will appear here once you make purchases'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default PurchaseTokens; 