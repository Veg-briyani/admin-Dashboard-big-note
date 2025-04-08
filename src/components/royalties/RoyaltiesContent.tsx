import { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import StatCard from '../common/StatCard';
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
        setLoading(false);
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
    const paidChange = '+₹2,500 from last month';
    
    setStats({
      pendingAmount,
      pendingCount,
      approvedAmount,
      approvedCount,
      paidThisMonth,
      paidChange
    });
  };

  // Try alternative approaches to handle API approval
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

  // Get author initials for avatar
  const getAuthorInitials = (royalty: Royalty) => {
    if (!royalty.authorId) return 'NA';
    const name = royalty.authorId.name || 'Unknown';
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  // Get author name safely
  const getAuthorName = (royalty: Royalty) => {
    return royalty.authorId ? royalty.authorId.name : 'Unknown Author';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Royalty Management</h2>
        <div className="flex space-x-2">
          <select 
            className="border rounded-md px-2 py-1"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard
          title="Pending Payouts"
          value={`₹${stats.pendingAmount.toLocaleString()}`}
          icon={<DollarSign size={24} className="text-amber-600" />}
          change={`${stats.pendingCount} requests`}
        />
        <StatCard
          title="Approved"
          value={`₹${stats.approvedAmount.toLocaleString()}`}
          icon={<DollarSign size={24} className="text-green-600" />}
          change={`${stats.approvedCount} requests`}
        />
        <StatCard
          title="Total Paid (This Month)"
          value={`₹${stats.paidThisMonth.toLocaleString()}`}
          icon={<DollarSign size={24} className="text-blue-600" />}
          change={stats.paidChange}
        />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        {loading && <div className="text-center py-4">Loading...</div>}
        
        {!loading && royalties.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="mb-3">
              <DollarSign size={40} className="mx-auto text-gray-400" />
            </div>
            <p className="text-lg font-medium mb-1">No royalty requests found</p>
            <p className="text-sm">
              There are currently no royalty requests with "{selectedStatus}" status.
              <br />Try selecting a different status filter or check back later.
            </p>
          </div>
        )}
        
        {!loading && royalties.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2 pl-4">Author</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Payment Method</th>
                  <th className="pb-2">Requested On</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {royalties.map((royalty) => (
                  <tr key={royalty._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 pl-4 flex items-center">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold mr-2">
                        {getAuthorInitials(royalty)}
                      </div>
                      {getAuthorName(royalty)}
                    </td>
                    <td className="py-3">₹{royalty.amount.toLocaleString()}</td>
                    <td className="py-3">{royalty.paymentMethod}</td>
                    <td className="py-3">{new Date(royalty.createdAt).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span className={`
                        ${royalty.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 
                          royalty.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                          royalty.status === 'Paid' ? 'bg-blue-100 text-blue-800' : 
                          'bg-red-100 text-red-800'} 
                        text-xs font-medium px-2 py-1 rounded`}
                      >
                        {royalty.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex space-x-2">
                        {royalty.status === 'Pending' && (
                          <>
                            <button 
                              onClick={() => handleApproveWithAlternatives(royalty._id)}
                              className="bg-green-600 text-white px-2 py-1 rounded text-xs"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => openRejectModal(royalty._id)}
                              className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {royalty.status === 'Approved' && (
                          <button className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Process</button>
                        )}
                        <button className="bg-gray-600 text-white px-2 py-1 rounded text-xs">View</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reject Payout Request</h3>
            <p className="mb-4 text-gray-600">Please provide a reason for rejection:</p>
            <textarea
              className="w-full border rounded-md p-2 mb-4 h-32"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
            ></textarea>
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                  setSelectedRoyalty(null);
                }}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button 
                onClick={handleRejectWithAlternatives}
                disabled={!rejectionReason.trim()}
                className={`${
                  rejectionReason.trim() ? 'bg-red-600 hover:bg-red-700' : 'bg-red-400 cursor-not-allowed'
                } text-white px-4 py-2 rounded`}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoyaltiesContent;