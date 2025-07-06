import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  QrCode, 
  Copy, 
  Plus, 
  Search, 
  Calendar,
  DollarSign,
  Percent,
  CheckCircle,
  Clock,
  AlertTriangle,
  X
} from 'lucide-react';

const CouponTokens = ({ wallet }) => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount: '',
    discountType: 'percentage',
    expiryDate: '',
    description: ''
  });

  useEffect(() => {
    const loadCouponTokens = async () => {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - in real app this would come from blockchain/smart contracts
      setCoupons([
        {
          id: '0x1111...2222',
          tokenId: '1',
          code: 'SAVE20',
          discount: 20,
          discountType: 'percentage',
          description: '20% Off Electronics',
          expiryDate: new Date('2024-02-15'),
          status: 'active',
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        },
        {
          id: '0x3333...4444',
          tokenId: '2',
          code: 'FLAT10',
          discount: 10,
          discountType: 'fixed',
          description: '$10 Off Any Purchase',
          expiryDate: new Date('2024-01-30'),
          status: 'used',
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        },
        {
          id: '0x5555...6666',
          tokenId: '3',
          code: 'WEEKEND25',
          discount: 25,
          discountType: 'percentage',
          description: '25% Off Weekend Sale',
          expiryDate: new Date('2024-01-20'),
          status: 'expired',
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        },
        {
          id: '0x7777...8888',
          tokenId: '4',
          code: 'NEWCUST50',
          discount: 50,
          discountType: 'fixed',
          description: '$50 Off First Purchase',
          expiryDate: new Date('2024-03-01'),
          status: 'active',
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        }
      ]);
      setLoading(false);
    };

    loadCouponTokens();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-status-success" />;
      case 'used':
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
      case 'used':
        return 'text-status-warning';
      case 'expired':
        return 'text-status-alert';
      default:
        return 'text-text-secondary';
    }
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

  const handleAddCoupon = () => {
    // In a real app, this would interact with smart contracts
    const coupon = {
      id: `0x${Math.random().toString(36).substr(2, 9)}...`,
      tokenId: (coupons.length + 1).toString(),
      code: newCoupon.code,
      discount: parseFloat(newCoupon.discount),
      discountType: newCoupon.discountType,
      description: newCoupon.description,
      expiryDate: new Date(newCoupon.expiryDate),
      status: 'active',
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    };
    
    setCoupons([coupon, ...coupons]);
    setNewCoupon({
      code: '',
      discount: '',
      discountType: 'percentage',
      expiryDate: '',
      description: ''
    });
    setShowAddModal(false);
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || coupon.status === filterStatus;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Coupon Tokens</h1>
          <p className="text-text-secondary">Manage your one-time-use blockchain coupons</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Coupon</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search by code or description..."
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
              <option value="used">Used</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Coupon Tokens Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCoupons.map((coupon) => (
          <div key={coupon.id} className="card hover:border-accent-secondary transition-colors duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Tag className="h-5 w-5 text-accent-secondary" />
                <span className="text-sm font-medium text-text-secondary">Token #{coupon.tokenId}</span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(coupon.status)}
                <span className={`text-sm font-medium ${getStatusColor(coupon.status)}`}>
                  {coupon.status.charAt(0).toUpperCase() + coupon.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-text-primary mb-1">{coupon.description}</h3>
                <p className="text-sm text-text-secondary font-mono">{coupon.code}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {coupon.discountType === 'percentage' ? (
                    <Percent className="h-4 w-4 text-status-success" />
                  ) : (
                    <DollarSign className="h-4 w-4 text-status-success" />
                  )}
                  <span className="font-semibold text-text-primary">
                    {coupon.discountType === 'percentage' ? `${coupon.discount}%` : `$${coupon.discount}`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-text-muted" />
                  <span className="text-sm text-text-secondary">
                    {formatDate(coupon.expiryDate)}
                  </span>
                </div>
              </div>

              <div className="bg-background-input rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted font-mono">
                    {coupon.id}
                  </span>
                  <button
                    onClick={() => copyToClipboard(coupon.id)}
                    className="p-1 hover:bg-background-card rounded transition-colors duration-200"
                  >
                    <Copy className="h-3 w-3 text-text-muted" />
                  </button>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedCoupon(coupon);
                    setShowQR(true);
                  }}
                  className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                >
                  <QrCode className="h-4 w-4" />
                  <span>Show QR</span>
                </button>
                <button className="flex-1 btn-secondary flex items-center justify-center space-x-2">
                  <Copy className="h-4 w-4" />
                  <span>Copy Code</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* QR Code Modal */}
      {showQR && selectedCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-overlay-modal" onClick={() => setShowQR(false)}></div>
          <div className="card max-w-md w-full relative">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                QR Code - {selectedCoupon.description}
              </h3>
              <div className="bg-white p-4 rounded-lg mb-4">
                <img
                  src={selectedCoupon.qrCode}
                  alt="QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <p className="text-sm text-text-secondary mb-4">
                Scan this QR code at any Walmart store to redeem your coupon
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowQR(false)}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
                <button
                  onClick={() => copyToClipboard(selectedCoupon.code)}
                  className="btn-primary flex-1"
                >
                  Copy Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Coupon Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-overlay-modal" onClick={() => setShowAddModal(false)}></div>
          <div className="card max-w-md w-full relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Add New Coupon</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-background-input rounded"
              >
                <X className="h-5 w-5 text-text-secondary" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Coupon Code
                </label>
                <input
                  type="text"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value})}
                  className="input-field w-full"
                  placeholder="e.g., SAVE20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon({...newCoupon, description: e.target.value})}
                  className="input-field w-full"
                  placeholder="e.g., 20% Off Electronics"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Discount
                  </label>
                  <input
                    type="number"
                    value={newCoupon.discount}
                    onChange={(e) => setNewCoupon({...newCoupon, discount: e.target.value})}
                    className="input-field w-full"
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Type
                  </label>
                  <select
                    value={newCoupon.discountType}
                    onChange={(e) => setNewCoupon({...newCoupon, discountType: e.target.value})}
                    className="input-field w-full"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={newCoupon.expiryDate}
                  onChange={(e) => setNewCoupon({...newCoupon, expiryDate: e.target.value})}
                  className="input-field w-full"
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCoupon}
                  className="btn-primary flex-1"
                >
                  Create Coupon
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredCoupons.length === 0 && (
        <div className="text-center py-12">
          <Tag className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No coupon tokens found</h3>
          <p className="text-text-secondary">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Your coupon tokens will appear here once you receive them'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default CouponTokens; 