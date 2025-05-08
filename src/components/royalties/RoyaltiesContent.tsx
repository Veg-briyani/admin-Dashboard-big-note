import { useState, useEffect } from 'react';
import { DollarSign, AlertCircle, CheckCircle, XCircle, Clock, Eye,  Search } from 'lucide-react';
import api from '../../services/api';

// Define the Royalty type to match your actual API response
interface Royalty {
  _id: string;
  authorId: {
    _id: string;
    name: string;
    email: string;
    id: string;
  } | null;
  amount: number;
  paymentMethod: string;
  status: 'Pending' | 'Approved' | 'Paid' | 'Rejected';
  createdAt: string;
  updatedAt: string;
  __v: number;
  paymentDate?: string;
}

// Define type for statistics we'll calculate from the data
interface RoyaltyStats {
  pendingAmount: number;
  pendingCount: number;
  approvedAmount: number;
  approvedCount: number;
  paidThisMonth: number;
  paidChange: string;
}

// Modern dashboard stat card component
const StatCard = ({ 
  title, 
  value, 
  icon, 
  change, 
  trend 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  change: string; 
  trend?: 'up' | 'down' | 'neutral' 
}) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
          <p className="text-2xl font-bold mb-1">{value}</p>
          <p className={`text-xs flex items-center ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 
            'text-gray-500'
          }`}>
            {change}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-gray-50">
          {icon}
        </div>
      </div>
    </div>
  );
};

// Status badge component
const StatusBadge = ({ status }: { status: Royalty['status'] }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'Pending':
        return { 
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          icon: <Clock size={14} className="text-amber-500 mr-1" />
        };
      case 'Approved':
        return { 
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          icon: <CheckCircle size={14} className="text-emerald-500 mr-1" />
        };
      case 'Paid':
        return { 
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          icon: <DollarSign size={14} className="text-blue-500 mr-1" />
        };
      case 'Rejected':
        return { 
          bg: 'bg-red-50',
          text: 'text-red-700',
          border: 'border-red-200',
          icon: <XCircle size={14} className="text-red-500 mr-1" />
        };
      default:
        return { 
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          icon: null
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
      {config.icon}
      {status}
    </span>
  );
};

// Author avatar component
const AuthorAvatar = ({ name }: { name: string }) => {
  const getInitials = () => {
    if (!name || name === 'Unknown Author') return 'UA';
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  // Generate a consistent color based on name
  const getColor = () => {
    const colors = [
      'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-indigo-500', 'bg-amber-500'
    ];
    
    if (name === 'Unknown Author') return 'bg-gray-400';
    
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    
    return colors[sum % colors.length];
  };

  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${getColor()}`}>
      {getInitials()}
    </div>
  );
};

// Empty state component
const EmptyState = ({ status }: { status: string }) => {
  return (
    <div className="text-center py-12 bg-gray-50 rounded-xl">
      <div className="mb-4 inline-flex p-4 rounded-full bg-gray-100">
        <DollarSign size={32} className="text-gray-400" />
      </div>
      <p className="text-lg font-medium text-gray-700 mb-2">No royalty requests found</p>
      <p className="text-sm text-gray-500 max-w-md mx-auto">
        There are currently no royalty requests with "{status}" status.
        <br />Try selecting a different status filter or check back later.
      </p>
    </div>
  );
};

// Modern Skeleton Loader for table rows
const TableRowSkeleton = () => {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <tr key={i} className="animate-pulse border-b">
          <td className="py-4 pl-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </td>
          <td className="py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
          <td className="py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
          <td className="py-4"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
          <td className="py-4"><div className="h-6 bg-gray-200 rounded w-16"></div></td>
          <td className="py-4">
            <div className="flex space-x-2">
              <div className="h-8 bg-gray-200 rounded w-16"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
};

// Alert component for errors
const Alert = ({ message }: { message: string }) => {
  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md mb-6">
      <div className="flex items-start">
        <AlertCircle size={20} className="text-red-500 mr-3 mt-0.5" />
        <div>
          <p className="text-sm text-red-700">{message}</p>
        </div>
      </div>
    </div>
  );
};

// Modal component
const Modal = ({ 
  title, 
  isOpen, 
  onClose, 
  onConfirm, 
  children, 
  confirmText = 'Confirm',
  confirmDisabled = false,
  confirmClass = 'bg-blue-600 hover:bg-blue-700'
}: { 
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children: React.ReactNode;
  confirmText?: string;
  confirmDisabled?: boolean;
  confirmClass?: string;
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-fadeIn">
        <div className="p-5 border-b">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="p-5">
          {children}
        </div>
        <div className="p-4 bg-gray-50 flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={`${confirmClass} ${confirmDisabled ? 'opacity-50 cursor-not-allowed' : ''} px-4 py-2 rounded-lg text-white transition-colors text-sm font-medium`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main component
const RoyaltiesContent = () => {
  const [royalties, setRoyalties] = useState<Royalty[]>([]);
  const [stats, setStats] = useState<RoyaltyStats>({
    pendingAmount: 0,
    pendingCount: 0,
    approvedAmount: 0,
    approvedCount: 0,
    paidThisMonth: 0,
    paidChange: '+₹0 from last month'
  });
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedRoyalty, setSelectedRoyalty] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch royalties based on selected status
  useEffect(() => {
    const fetchRoyalties = async () => {
      try {
        setLoading(true);
        
        // Use the correct API endpoint
        const response = await api.get('/admin/payouts/history');
        
        // Handle the array response directly
        let royaltiesData: Royalty[] = response.data;
        
        // Filter based on selected status if not "all"
        if (selectedStatus !== 'all') {
          // Convert to lowercase for case-insensitive comparison
          const statusFilter = selectedStatus.toLowerCase();
          royaltiesData = royaltiesData.filter(
            r => r.status.toLowerCase() === statusFilter
          );
        }
        
        setRoyalties(royaltiesData);
        
        // Calculate stats from the data
        calculateStats(royaltiesData);
        
        setError(null);
      } catch (error) {
        console.error('Error fetching royalties:', error);
        setError('Failed to load royalty requests. Please try again.');
      } finally {
        // Add a small delay to make loading state noticeable for better UX
        setTimeout(() => setLoading(false), 500);
      }
    };

    fetchRoyalties();
  }, [selectedStatus]);
  
  // Calculate statistics from royalties data
  const calculateStats = (data: Royalty[]) => {
    const pendingRoyalties = data.filter(r => r.status === 'Pending');
    const approvedRoyalties = data.filter(r => r.status === 'Approved');
    const paidRoyalties = data.filter(r => r.status === 'Paid');
    
    // Calculate pending stats
    const pendingAmount = pendingRoyalties.reduce((sum, r) => sum + r.amount, 0);
    const pendingCount = pendingRoyalties.length;
    
    // Calculate approved stats
    const approvedAmount = approvedRoyalties.reduce((sum, r) => sum + r.amount, 0);
    const approvedCount = approvedRoyalties.length;
    
    // Calculate paid stats for current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const paidThisMonth = paidRoyalties
      .filter(r => new Date(r.createdAt) >= firstDayOfMonth)
      .reduce((sum, r) => sum + r.amount, 0);
    
    // For demonstration, we'll use a placeholder for month-over-month change
    const paidChange = '+ from last month';
    
    setStats({
      pendingAmount,
      pendingCount,
      approvedAmount,
      approvedCount,
      paidThisMonth,
      paidChange
    });
  };

  // Handle royalty approval with alternative approaches
  const handleApproveWithAlternatives = async (id: string) => {
    try {
      setLoading(true);
      
      // Try the standard approach first with empty payload
      try {
        await api.post(`/admin/royalties/${id}/approve`, {});
        console.log("Approach 1 succeeded: POST with empty body");
      } catch (error: any) {
        if (error?.response?.status === 400) {
          // Try alternative approaches if the first fails with 400
          try {
            // Try with a different payload format
            await api.post(`/admin/royalties/${id}/approve`, { royaltyId: id });
            console.log("Approach 2 succeeded: POST with royaltyId in body");
          } catch (innerError: any) {
            if (innerError?.response?.status === 400) {
              // Try with a different endpoint structure
              await api.post(`/admin/royalties/approve`, { royaltyId: id });
              console.log("Approach 3 succeeded: Different endpoint with royaltyId in body");
            } else {
              throw innerError;
            }
          }
        } else {
          throw error;
        }
      }
      
      // Update the local state to reflect the change
      setRoyalties(prevRoyalties => 
        prevRoyalties.map(royalty => 
          royalty._id === id ? { ...royalty, status: 'Approved' } : royalty
        )
      );
      
      // Refresh data
      const response = await api.get('/admin/payouts/history');
      const royaltiesData: Royalty[] = response.data;
      setRoyalties(royaltiesData);
      calculateStats(royaltiesData);
      
      setError(null);
    } catch (error) {
      console.error('Error approving royalty:', error);
      setError('Failed to approve royalty. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open rejection modal
  const openRejectModal = (id: string) => {
    setSelectedRoyalty(id);
    setShowRejectionModal(true);
  };

  // Handle rejection with alternatives
  const handleRejectWithAlternatives = async () => {
    if (!selectedRoyalty || !rejectionReason) return;
    
    try {
      setLoading(true);
      
      // Try different approaches to handle rejection
      try {
        // First try the main approach
        await api.post(`/admin/royalties/${selectedRoyalty}/reject`, { reason: rejectionReason });
        console.log("Rejection approach 1 succeeded: POST with reason in body");
      } catch (error: any) {
        if (error?.response?.status === 400) {
          // Try alternative approaches
          try {
            // Try with a different payload format
            await api.post(`/admin/royalties/${selectedRoyalty}/reject`, { 
              royaltyId: selectedRoyalty,
              reason: rejectionReason 
            });
            console.log("Rejection approach 2 succeeded: POST with royaltyId and reason in body");
          } catch (innerError: any) {
            if (innerError?.response?.status === 400) {
              // Try with a different endpoint structure
              await api.post(`/admin/royalties/reject`, { 
                royaltyId: selectedRoyalty, 
                reason: rejectionReason 
              });
              console.log("Rejection approach 3 succeeded: Different endpoint with royaltyId and reason in body");
            } else {
              throw innerError;
            }
          }
        } else {
          throw error;
        }
      }
      
      // Update the local state to reflect the change
      setRoyalties(prevRoyalties => 
        prevRoyalties.map(royalty => 
          royalty._id === selectedRoyalty ? { ...royalty, status: 'Rejected' } : royalty
        )
      );
      
      // Reset modal state
      setShowRejectionModal(false);
      setRejectionReason('');
      setSelectedRoyalty(null);
      
      // Refresh data
      const response = await api.get('/admin/payouts/history');
      const royaltiesData: Royalty[] = response.data;
      setRoyalties(royaltiesData);
      calculateStats(royaltiesData);
      
      setError(null);
    } catch (error) {
      console.error('Error rejecting royalty:', error);
      setError('Failed to reject royalty. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get author name safely
  const getAuthorName = (royalty: Royalty) => {
    return royalty.authorId ? royalty.authorId.name : 'Unknown Author';
  };

  // Filter royalties based on search query
  const filteredRoyalties = royalties.filter(royalty => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const authorName = getAuthorName(royalty).toLowerCase();
    const amount = royalty.amount.toString();
    const method = royalty.paymentMethod.toLowerCase();
    
    return authorName.includes(query) || 
           amount.includes(query) || 
           method.includes(query);
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      maximumFractionDigits: 0 
    }).format(amount);
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Royalty Management</h1>
            <p className="text-gray-500 mt-1">Manage and process author royalty payments</p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-auto">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full sm:w-64 pl-10 pr-4 py-2 border-gray-300 bg-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by author or amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <select 
              className="w-full sm:w-auto bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="pending">Pending Requests</option>
              <option value="approved">Approved Requests</option>
              <option value="paid">Paid Requests</option>
              <option value="rejected">Rejected Requests</option>
              <option value="all">All Requests</option>
            </select>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Pending Payouts"
            value={formatCurrency(stats.pendingAmount)}
            icon={<Clock size={24} className="text-amber-500" />}
            change={`${stats.pendingCount} pending requests`}
            trend="neutral"
          />
          <StatCard
            title="Approved Payouts"
            value={formatCurrency(stats.approvedAmount)}
            icon={<CheckCircle size={24} className="text-emerald-500" />}
            change={`${stats.approvedCount} approved requests`}
            trend="up"
          />
          <StatCard
            title="Paid This Month"
            value={formatCurrency(stats.paidThisMonth)}
            icon={<DollarSign size={24} className="text-blue-500" />}
            change={stats.paidChange}
            trend="up"
          />
        </div>
        
        {/* Error Alert */}
        {error && <Alert message={error} />}
        
        {/* Content Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Author</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Payment Method</th>
                  <th className="px-6 py-4 font-medium">Requested</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <TableRowSkeleton />
                ) : filteredRoyalties.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4">
                      <EmptyState status={selectedStatus} />
                    </td>
                  </tr>
                ) : (
                  filteredRoyalties.map((royalty) => (
                    <tr key={royalty._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <AuthorAvatar name={getAuthorName(royalty)} />
                          <div className="ml-3">
                            <p className="font-medium text-gray-800">{getAuthorName(royalty)}</p>
                            {royalty.authorId && (
                              <p className="text-xs text-gray-500">{royalty.authorId.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {formatCurrency(royalty.amount)}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {royalty.paymentMethod}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        <div>
                          {new Date(royalty.createdAt).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(royalty.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={royalty.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {royalty.status === 'Pending' && (
                            <>
                              <button 
                                onClick={() => handleApproveWithAlternatives(royalty._id)}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                              >
                                <CheckCircle size={14} className="mr-1" />
                                Approve
                              </button>
                              <button 
                                onClick={() => openRejectModal(royalty._id)}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                <XCircle size={14} className="mr-1" />
                                Reject
                              </button>
                            </>
                          )}
                          {royalty.status === 'Approved' && (
                            <button className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                              <DollarSign size={14} className="mr-1" />
                              Process
                            </button>
                          )}
                          <button className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            <Eye size={14} className="mr-1" />
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      <Modal
        title="Reject Payout Request"
        isOpen={showRejectionModal}
        onClose={() => {
          setShowRejectionModal(false);
          setRejectionReason('');
          setSelectedRoyalty(null);
        }}
        onConfirm={handleRejectWithAlternatives}
        confirmText="Reject Request"
        confirmDisabled={!rejectionReason.trim()}
        confirmClass="bg-red-600 hover:bg-red-700"
      >
        <div>
          <p className="mb-4 text-gray-600">Please provide a reason for rejection:</p>
          <textarea
            className="w-full border rounded-lg p-3 mb-2 h-32 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..."
          ></textarea>
          <p className="text-xs text-gray-500">
            This reason will be visible to the author in their dashboard.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default RoyaltiesContent;