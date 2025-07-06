import React, { useState, useEffect } from 'react';
import { 
  Users, 
  QrCode, 
  Search, 
  Filter,
  Calendar,
  DollarSign,
  Package,
  CheckCircle,
  Clock,
  AlertTriangle,
  Shield,
  UserCheck,
  FileText,
  Camera
} from 'lucide-react';

const Returns = ({ wallet }) => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [newReturn, setNewReturn] = useState({
    purchaseTokenId: '',
    reason: '',
    condition: 'good',
    notes: ''
  });

  useEffect(() => {
    const loadReturns = async () => {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - in real app this would come from blockchain/smart contracts
      setReturns([
        {
          id: 'RET001',
          purchaseTokenId: '0x1234...5678',
          item: 'Gaming Laptop',
          originalAmount: 1299.99,
          returnAmount: 1299.99,
          reason: 'Defective product',
          condition: 'defective',
          status: 'approved',
          requestDate: new Date('2024-01-18'),
          approvedDate: new Date('2024-01-19'),
          approvedBy: 'Manager Smith',
          notes: 'Laptop screen has dead pixels'
        },
        {
          id: 'RET002',
          purchaseTokenId: '0x8765...4321',
          item: 'Wireless Headphones',
          originalAmount: 89.99,
          returnAmount: 89.99,
          reason: 'Changed mind',
          condition: 'good',
          status: 'pending',
          requestDate: new Date('2024-01-20'),
          approvedDate: null,
          approvedBy: null,
          notes: 'Customer wants different model'
        },
        {
          id: 'RET003',
          purchaseTokenId: '0xabcd...efgh',
          item: 'Smart Watch',
          originalAmount: 299.99,
          returnAmount: 250.00,
          reason: 'Minor damage',
          condition: 'damaged',
          status: 'approved',
          requestDate: new Date('2024-01-15'),
          approvedDate: new Date('2024-01-16'),
          approvedBy: 'Manager Johnson',
          notes: 'Scratched screen, partial refund approved'
        },
        {
          id: 'RET004',
          purchaseTokenId: '0x9876...5432',
          item: 'Bluetooth Speaker',
          originalAmount: 79.99,
          returnAmount: 0,
          reason: 'Outside return window',
          condition: 'good',
          status: 'rejected',
          requestDate: new Date('2024-01-10'),
          approvedDate: new Date('2024-01-11'),
          approvedBy: 'Manager Davis',
          notes: 'Return window expired'
        }
      ]);
      setLoading(false);
    };

    loadReturns();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-status-success" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-status-warning" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4 text-status-alert" />;
      default:
        return <Clock className="h-4 w-4 text-text-secondary" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-status-success';
      case 'pending':
        return 'text-status-warning';
      case 'rejected':
        return 'text-status-alert';
      default:
        return 'text-text-secondary';
    }
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'good':
        return 'text-status-success';
      case 'damaged':
        return 'text-status-warning';
      case 'defective':
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

  const handleSubmitReturn = () => {
    // In a real app, this would interact with smart contracts
    const returnRequest = {
      id: `RET${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      purchaseTokenId: newReturn.purchaseTokenId,
      item: 'Item from Purchase Token', // Would be fetched from blockchain
      originalAmount: 299.99, // Would be fetched from blockchain
      returnAmount: 299.99,
      reason: newReturn.reason,
      condition: newReturn.condition,
      status: 'pending',
      requestDate: new Date(),
      approvedDate: null,
      approvedBy: null,
      notes: newReturn.notes
    };
    
    setReturns([returnRequest, ...returns]);
    setNewReturn({
      purchaseTokenId: '',
      reason: '',
      condition: 'good',
      notes: ''
    });
    setShowReturnModal(false);
  };

  const filteredReturns = returns.filter(returnItem => {
    const matchesSearch = returnItem.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         returnItem.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || returnItem.status === filterStatus;
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
          <h1 className="text-2xl font-bold text-text-primary">Returns</h1>
          <p className="text-text-secondary">Process and track return requests with blockchain verification</p>
        </div>
        <button
          onClick={() => setShowReturnModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Users className="h-4 w-4" />
          <span>New Return</span>
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
                placeholder="Search by item or return ID..."
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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Returns List */}
      <div className="space-y-4">
        {filteredReturns.map((returnItem) => (
          <div key={returnItem.id} className="card hover:border-accent-primary transition-colors duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Package className="h-5 w-5 text-accent-primary" />
                <div>
                  <h3 className="font-semibold text-text-primary">{returnItem.item}</h3>
                  <p className="text-sm text-text-secondary">Return ID: {returnItem.id}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(returnItem.status)}
                <span className={`text-sm font-medium ${getStatusColor(returnItem.status)}`}>
                  {returnItem.status.charAt(0).toUpperCase() + returnItem.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-text-secondary mb-1">Original Amount</p>
                <p className="font-semibold text-text-primary">{formatCurrency(returnItem.originalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-1">Return Amount</p>
                <p className="font-semibold text-status-success">{formatCurrency(returnItem.returnAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-1">Condition</p>
                <p className={`font-semibold ${getConditionColor(returnItem.condition)}`}>
                  {returnItem.condition.charAt(0).toUpperCase() + returnItem.condition.slice(1)}
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div>
                <p className="text-sm text-text-secondary mb-1">Reason</p>
                <p className="text-text-primary">{returnItem.reason}</p>
              </div>
              {returnItem.notes && (
                <div>
                  <p className="text-sm text-text-secondary mb-1">Notes</p>
                  <p className="text-text-primary">{returnItem.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-sm text-text-secondary">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Requested: {formatDate(returnItem.requestDate)}</span>
                </div>
                {returnItem.approvedDate && (
                  <div className="flex items-center space-x-1">
                    <UserCheck className="h-4 w-4" />
                    <span>Approved: {formatDate(returnItem.approvedDate)}</span>
                  </div>
                )}
              </div>
              {returnItem.approvedBy && (
                <div className="flex items-center space-x-1">
                  <Shield className="h-4 w-4" />
                  <span>By: {returnItem.approvedBy}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border-default">
              <div className="flex space-x-2">
                <button className="flex-1 btn-secondary flex items-center justify-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>View Details</span>
                </button>
                <button className="flex-1 btn-secondary flex items-center justify-center space-x-2">
                  <QrCode className="h-4 w-4" />
                  <span>Scan QR</span>
                </button>
                {returnItem.status === 'pending' && (
                  <button className="flex-1 btn-primary flex items-center justify-center space-x-2">
                    <Camera className="h-4 w-4" />
                    <span>Process Return</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-overlay-modal" onClick={() => setShowReturnModal(false)}></div>
          <div className="card max-w-md w-full relative">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text-primary mb-2">Submit Return Request</h3>
              <p className="text-text-secondary">Enter the purchase token ID and return details</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Purchase Token ID
                </label>
                <input
                  type="text"
                  value={newReturn.purchaseTokenId}
                  onChange={(e) => setNewReturn({...newReturn, purchaseTokenId: e.target.value})}
                  className="input-field w-full"
                  placeholder="0x1234...5678"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Return Reason
                </label>
                <select
                  value={newReturn.reason}
                  onChange={(e) => setNewReturn({...newReturn, reason: e.target.value})}
                  className="input-field w-full"
                >
                  <option value="">Select a reason</option>
                  <option value="Defective product">Defective product</option>
                  <option value="Changed mind">Changed mind</option>
                  <option value="Wrong size">Wrong size</option>
                  <option value="Damaged during shipping">Damaged during shipping</option>
                  <option value="Not as described">Not as described</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Item Condition
                </label>
                <select
                  value={newReturn.condition}
                  onChange={(e) => setNewReturn({...newReturn, condition: e.target.value})}
                  className="input-field w-full"
                >
                  <option value="good">Good - Like new</option>
                  <option value="damaged">Damaged - Minor wear</option>
                  <option value="defective">Defective - Not working</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={newReturn.notes}
                  onChange={(e) => setNewReturn({...newReturn, notes: e.target.value})}
                  className="input-field w-full h-20 resize-none"
                  placeholder="Provide additional details about the return..."
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReturn}
                  className="btn-primary flex-1"
                >
                  Submit Return
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredReturns.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No returns found</h3>
          <p className="text-text-secondary">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Your return requests will appear here once submitted'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default Returns; 