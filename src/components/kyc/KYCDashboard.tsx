import { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  Eye, 
  CheckCircle, 
  XCircle, 
  RotateCw, 
  Search,
  Calendar,
  FileCheck,
  User,
  Clock,
  Filter,
  X,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import api from '../../services/api';

interface KYCRequest {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    id: string;
  };
  bankAccount: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  kycInformation: {
    aadhaarNumber: string;
    panNumber: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  documents?: string[];
}

const KYCDashboard = () => {
  const [kycRequests, setKycRequests] = useState<KYCRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<KYCRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<KYCRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Fetch KYC requests on component mount
  useEffect(() => {
    fetchKYCRequests();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...kycRequests];
    
    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(req => req.status === selectedFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(req => 
        req.user.name.toLowerCase().includes(query) || 
        req.user.email.toLowerCase().includes(query) ||
        req.kycInformation.aadhaarNumber.includes(query) ||
        req.kycInformation.panNumber.toLowerCase().includes(query)
      );
    }
    
    setFilteredRequests(filtered);
  }, [kycRequests, selectedFilter, searchQuery]);

  useEffect(() => {
    if (kycRequests.length > 0) {
      applyFilters();
    }
  }, [applyFilters, kycRequests.length]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchKYCRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/kyc/update-requests');
      setKycRequests(response.data);
    } catch (err) {
      setError('Failed to fetch KYC requests. Please try again later.');
      console.error('Error fetching KYC requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewKYCDetails = (request: KYCRequest) => {
    setSelectedRequest(request);
  };

  const handleApproveKYC = async () => {
    if (!selectedRequest) return;
    
    try {
      setProcessingAction(true);
      await api.post(`/admin/kyc/update-requests/${selectedRequest._id}/approve`);
      
      const updatedRequests = kycRequests.map(req => 
        req._id === selectedRequest._id ? { 
          ...req, 
          status: 'approved' as const 
        } : req
      );
      
      setKycRequests(updatedRequests);
      setSelectedRequest(null);
      setSuccessMessage('KYC request approved successfully');
    } catch (err) {
      setError('Failed to approve KYC request. Please try again.');
      console.error('Error approving KYC:', err);
    } finally {
      setProcessingAction(false);
    }
  };

  const openRejectModal = () => {
    setShowRejectModal(true);
  };

  const handleRejectKYC = async () => {
    if (!selectedRequest || !rejectionReason.trim()) return;
    
    try {
      setProcessingAction(true);
      await api.post(`/admin/kyc/update-requests/${selectedRequest._id}/reject`, {
        reason: rejectionReason
      });
      
      const updatedRequests = kycRequests.map(req => 
        req._id === selectedRequest._id ? { 
          ...req, 
          status: 'rejected' as const 
        } : req
      );
      
      setKycRequests(updatedRequests);
      setSelectedRequest(null);
      setRejectionReason('');
      setShowRejectModal(false);
      setSuccessMessage('KYC request rejected successfully');
    } catch (err) {
      setError('Failed to reject KYC request. Please try again.');
      console.error('Error rejecting KYC:', err);
    } finally {
      setProcessingAction(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rejected':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3.5 w-3.5" />;
      case 'approved':
        return <CheckCircle className="h-3.5 w-3.5" />;
      case 'rejected':
        return <XCircle className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  const getFilterCount = (status: 'pending' | 'approved' | 'rejected' | 'all') => {
    if (status === 'all') return kycRequests.length;
    return kycRequests.filter(req => req.status === status).length;
  };

  return (
    <div className="w-full p-4 pb-6">
      {successMessage && (
        <div className="fixed top-4 right-4 flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 z-50 animate-fade-in-out">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-2 text-emerald-500 hover:text-emerald-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center space-x-2 px-4 py-3 rounded-lg shadow-md bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-rose-500 hover:text-rose-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          KYC Verification
        </h1>
        <p className="mt-1 text-gray-600">Review and manage Know Your Customer verification requests</p>
      </header>

      {/* Filter and search bar */}
      <div className="mb-6 rounded-xl shadow-sm p-4 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 flex-grow">
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-10 pr-4 py-2.5 w-full rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="Search by name, email, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-200"
              >
                <Filter className="h-4 w-4" />
                <span>{selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg overflow-hidden z-20 bg-white border border-gray-200">
                  <div className="py-1">
                    <button 
                      onClick={() => {
                        setSelectedFilter('pending');
                        setShowFilterMenu(false);
                      }}
                      className={`flex items-center space-x-2 px-4 py-2 text-sm w-full text-left hover:bg-gray-50 text-gray-700 ${selectedFilter === 'pending' ? 'bg-gray-100' : ''}`}
                    >
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span>Pending ({getFilterCount('pending')})</span>
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedFilter('approved');
                        setShowFilterMenu(false);
                      }}
                      className={`flex items-center space-x-2 px-4 py-2 text-sm w-full text-left hover:bg-gray-50 text-gray-700 ${selectedFilter === 'approved' ? 'bg-gray-100' : ''}`}
                    >
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Approved ({getFilterCount('approved')})</span>
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedFilter('rejected');
                        setShowFilterMenu(false);
                      }}
                      className={`flex items-center space-x-2 px-4 py-2 text-sm w-full text-left hover:bg-gray-50 text-gray-700 ${selectedFilter === 'rejected' ? 'bg-gray-100' : ''}`}
                    >
                      <XCircle className="h-4 w-4 text-rose-500" />
                      <span>Rejected ({getFilterCount('rejected')})</span>
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedFilter('all');
                        setShowFilterMenu(false);
                      }}
                      className={`flex items-center space-x-2 px-4 py-2 text-sm w-full text-left hover:bg-gray-50 text-gray-700 ${selectedFilter === 'all' ? 'bg-gray-100' : ''}`}
                    >
                      <Sparkles className="h-4 w-4 text-indigo-500" />
                      <span>All Requests ({getFilterCount('all')})</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <button 
            onClick={fetchKYCRequests}
            className="flex items-center justify-center px-4 py-2.5 rounded-lg transition-colors bg-indigo-50 hover:bg-indigo-100 text-indigo-600"
            disabled={loading}
          >
            <RotateCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl shadow-sm overflow-hidden bg-white">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-12 w-12 rounded-full animate-spin mb-4 border-4 border-indigo-200 border-t-indigo-600"></div>
            <p className="text-gray-600">Loading KYC requests...</p>
          </div>
        ) : selectedRequest ? (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                KYC Request Details
              </h2>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="rounded-full p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <span className="sr-only">Close</span>
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedRequest.status)}`}>
                {getStatusIcon(selectedRequest.status)}
                <span className="ml-1.5">
                  {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                </span>
              </span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl bg-gray-50">
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-indigo-500" />
                  User Information
                </h3>
                
                <div className="space-y-5">
                  <div className="border-b border-gray-200 pb-4">
                    <label className="block text-sm font-medium text-gray-500">User ID</label>
                    <div className="mt-1 text-gray-800 font-mono text-sm">{selectedRequest.user._id}</div>
                  </div>
                  
                  <div className="border-b border-gray-200 pb-4">
                    <label className="block text-sm font-medium text-gray-500">Name</label>
                    <div className="mt-1 text-gray-800 font-medium">{selectedRequest.user.name}</div>
                  </div>
                  
                  <div className="border-b border-gray-200 pb-4">
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <div className="mt-1 text-gray-800">{selectedRequest.user.email}</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Submitted On</label>
                    <div className="mt-1 text-gray-800 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(selectedRequest.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 rounded-xl bg-gray-50">
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <FileCheck className="h-5 w-5 mr-2 text-indigo-500" />
                  KYC Information
                </h3>
                
                <div className="space-y-5">
                  <div className="border-b border-gray-200 pb-4">
                    <label className="block text-sm font-medium text-gray-500">Aadhaar Number</label>
                    <div className="mt-1 text-gray-800 font-mono text-lg tracking-wider">{selectedRequest.kycInformation.aadhaarNumber}</div>
                  </div>
                  
                  <div className="border-b border-gray-200 pb-4">
                    <label className="block text-sm font-medium text-gray-500">PAN Number</label>
                    <div className="mt-1 text-gray-800 font-mono text-lg tracking-wider">{selectedRequest.kycInformation.panNumber}</div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Bank Account Details</h4>
                    <div className="rounded-lg bg-white border border-gray-200 p-4">
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500">Account Number</label>
                          <div className="font-mono text-sm mt-1 text-gray-800">{selectedRequest.bankAccount.accountNumber}</div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">IFSC Code</label>
                          <div className="font-mono text-sm mt-1 text-gray-800">{selectedRequest.bankAccount.ifscCode}</div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Bank Name</label>
                          <div className="mt-1 text-gray-800">{selectedRequest.bankAccount.bankName}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {selectedRequest.status === 'pending' && (
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={openRejectModal}
                  disabled={processingAction}
                  className="px-4 py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 bg-white text-rose-600 border border-rose-600 hover:bg-rose-50 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center">
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Request
                  </div>
                </button>
                
                <button
                  onClick={handleApproveKYC}
                  disabled={processingAction}
                  className="px-4 py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center">
                    {processingAction ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve Request
                  </div>
                </button>
              </div>
            )}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-gray-100">
              <AlertTriangle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-1 text-gray-900">No KYC requests found</h3>
            <p className="mb-6 text-gray-500">
              {selectedFilter === 'all' ? 
                'There are no KYC requests in the system yet.' : 
                `There are no ${selectedFilter} KYC requests at the moment.`}
            </p>
            <button
              onClick={fetchKYCRequests}
              className="inline-flex items-center px-4 py-2 rounded-lg shadow-sm text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Refresh List
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submission Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Numbers
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-600 font-medium">
                            {request.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{request.user.name}</div>
                          <div className="text-sm text-gray-500">{request.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(request.createdAt).split(',')[0]}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(request.createdAt).split(',')[1]}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-xs text-gray-500">
                          <span className="font-semibold">Aadhaar:</span> {request.kycInformation.aadhaarNumber}
                        </div>
                        <div className="text-xs text-gray-500">
                          <span className="font-semibold">PAN:</span> {request.kycInformation.panNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => viewKYCDetails(request)}
                        className="inline-flex items-center px-3 py-1 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="rounded-xl shadow-xl max-w-md w-full p-6 m-4 bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Reject KYC Request
              </h3>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="mb-3 text-gray-600">
                Please provide a reason for rejection. This will be shared with the user.
              </p>
              <textarea 
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="px-4 py-2 rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectKYC}
                disabled={!rejectionReason.trim() || processingAction}
                className={`px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 transition-colors
                  ${(!rejectionReason.trim() || processingAction) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center">
                  {processingAction ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject Request
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCDashboard;