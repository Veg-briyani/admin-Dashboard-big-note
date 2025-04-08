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
  Filter
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


  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">KYC Verification Dashboard</h1>
          <p className="text-gray-600">Review and manage Know Your Customer verification requests</p>
        </header>

        {successMessage && (
          <div className="fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md z-50 animate-fade-in-out">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="ml-auto text-red-500 hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  type="text"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-64"
                  placeholder="Search by name, email, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select 
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value as typeof selectedFilter)}
                >
                  <option value="pending">Pending Requests</option>
                  <option value="approved">Approved Requests</option>
                  <option value="rejected">Rejected Requests</option>
                  <option value="all">All Requests</option>
                </select>
              </div>
            </div>
            
            <button 
              onClick={fetchKYCRequests}
              className="flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
              disabled={loading}
            >
              <RotateCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
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
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span className="sr-only">Close</span>
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mb-6">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                  ${selectedRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    selectedRequest.status === 'approved' ? 'bg-green-100 text-green-800' : 
                    'bg-red-100 text-red-800'}`}
                >
                  {selectedRequest.status === 'pending' ? (
                    <Clock className="h-4 w-4 mr-1" />
                  ) : selectedRequest.status === 'approved' ? (
                    <CheckCircle className="h-4 w-4 mr-1" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-1" />
                  )}
                  {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                </span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    User Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">User ID</label>
                      <div className="mt-1 text-gray-800">{selectedRequest.user._id}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Name</label>
                      <div className="mt-1 text-gray-800 font-medium">{selectedRequest.user.name}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Email</label>
                      <div className="mt-1 text-gray-800">{selectedRequest.user.email}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Submitted On</label>
                      <div className="mt-1 text-gray-800 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        {formatDate(selectedRequest.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                    <FileCheck className="h-5 w-5 mr-2 text-blue-600" />
                    KYC Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Aadhaar Number</label>
                      <div className="mt-1 text-gray-800 font-mono">{selectedRequest.kycInformation.aadhaarNumber}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">PAN Number</label>
                      <div className="mt-1 text-gray-800 font-mono">{selectedRequest.kycInformation.panNumber}</div>
                    </div>
                    
                    <div className="pt-2">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Bank Account Details</h4>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <div className="grid grid-cols-1 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500">Account Number</label>
                            <div className="font-mono">{selectedRequest.bankAccount.accountNumber}</div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500">IFSC Code</label>
                            <div className="font-mono">{selectedRequest.bankAccount.ifscCode}</div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500">Bank Name</label>
                            <div>{selectedRequest.bankAccount.bankName}</div>
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
                    className="px-4 py-2 bg-white border border-red-600 text-red-600 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Request
                    </div>
                  </button>
                  
                  <button
                    onClick={handleApproveKYC}
                    disabled={processingAction}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="bg-gray-100 inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
                <AlertTriangle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No KYC requests found</h3>
              <p className="text-gray-500 mb-6">
                {selectedFilter === 'all' ? 
                  'There are no KYC requests in the system yet.' : 
                  `There are no ${selectedFilter} KYC requests at the moment.`}
              </p>
              <button
                onClick={fetchKYCRequests}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
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
                        <div className="text-sm text-gray-900">{formatDate(request.createdAt).split(',')[0]}</div>
                        <div className="text-xs text-gray-500">{formatDate(request.createdAt).split(',')[1]}</div>
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
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                            'bg-red-100 text-red-800'}`}
                        >
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => viewKYCDetails(request)}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
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
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reject KYC Request</h3>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                Please provide a reason for rejection. This will be shared with the user.
              </p>
              <textarea 
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectKYC}
                disabled={!rejectionReason.trim() || processingAction}
                className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors
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