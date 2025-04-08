import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Calendar,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader,
  AlertCircle
} from 'lucide-react';
import notificationService from '../../services/notificationService';
import { format } from 'date-fns';

// Define interfaces for the admin notifications
interface Recipient {
  _id: string;
  name: string;
  email: string;
  id: string;
}

interface AdminNotificationItem {
  _id: string;
  recipient?: Recipient;
  title?: string;
  message: string;
  type: string;
  read: boolean;
  actioned: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  timeAgo?: string;
  id: string;
}

interface PaginationData {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

interface AdminNotificationResponse {
  notifications: AdminNotificationItem[];
  pagination: PaginationData;
}

const AdminNotificationDashboard = () => {
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [limit] = useState<number>(10);
  
  // Load notifications on mount and when filters change
  useEffect(() => {
    fetchNotifications();
  }, [currentPage, startDate, endDate, selectedType]);
  
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page: currentPage,
        limit
      };
      
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedType !== 'all') params.type = selectedType;
      
      // Make API call to admin notifications endpoint
      const response = await fetch('/api/notifications/admin?' + new URLSearchParams(params));
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }
      
      const data = await response.json() as AdminNotificationResponse;
      
      setNotifications(data.notifications);
      setTotalPages(data.pagination.pages);
      setTotalItems(data.pagination.total);
    } catch (err: any) {
      console.error('Error fetching admin notifications:', err);
      setError(err.message || 'Failed to load admin notifications');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when filtering
    fetchNotifications();
  };
  
  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedType('all');
    setCurrentPage(1);
  };
  
  const exportNotifications = () => {
    // Implementation for exporting notifications data to CSV
    const headers = 'ID,Recipient,Title,Message,Type,Read,Actioned,Created At\n';
    
    const csvContent = notifications.map(item => {
      return `"${item._id}","${item.recipient?.name || 'N/A'}","${item.title || ''}","${
        item.message.replace(/"/g, '""')
      }","${item.type}","${item.read}","${item.actioned}","${format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm:ss')}"`;
    }).join('\n');
    
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `admin-notifications-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'system':
        return 'bg-blue-100 text-blue-800';
      case 'payout':
        return 'bg-indigo-100 text-indigo-800';
      case 'kyc':
        return 'bg-amber-100 text-amber-800';
      case 'order':
        return 'bg-green-100 text-green-800';
      case 'author':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getReadStatusStyles = (read: boolean) => {
    return read 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="px-6 py-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Bell className="text-indigo-600" size={28} />
            Admin Notifications
          </h2>
          <p className="text-gray-500 mt-1">
            View and manage all notifications in the system
          </p>
        </div>
        
        <button 
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
          onClick={exportNotifications}
          disabled={notifications.length === 0}
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <form onSubmit={handleFilter} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="startDate" className="text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              id="startDate"
              className="border border-gray-300 rounded-lg px-3 py-2"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="endDate" className="text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              id="endDate"
              className="border border-gray-300 rounded-lg px-3 py-2"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="type" className="text-sm font-medium text-gray-700">Notification Type</label>
            <select
              id="type"
              className="border border-gray-300 rounded-lg px-3 py-2"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="admin">Admin</option>
              <option value="system">System</option>
              <option value="payout">Payout</option>
              <option value="kyc">KYC</option>
              <option value="order">Order</option>
              <option value="author">Author</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Filter size={18} />
              Apply Filters
            </button>
            
            <button
              type="button"
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={resetFilters}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
      
      {/* Notifications table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader size={36} className="text-indigo-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4">
            <AlertCircle size={36} className="text-red-500 mb-3" />
            <h3 className="text-gray-800 font-medium mb-1">Error loading notifications</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              onClick={() => fetchNotifications()}
            >
              Try Again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4">
            <Bell size={48} className="text-gray-300 mb-3" />
            <h3 className="text-gray-800 font-medium mb-1">No notifications found</h3>
            <p className="text-gray-500 max-w-md">
              {startDate || endDate || selectedType !== 'all' ? 
                'Try changing your filters to see more results.' : 
                'No notifications have been recorded yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title/Message</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {notifications.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.recipient ? (
                        <>
                          <div className="text-sm font-medium text-gray-900">{item.recipient.name}</div>
                          <div className="text-sm text-gray-500">{item.recipient.email}</div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">System notification</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.title && <div className="text-sm font-medium text-gray-900">{item.title}</div>}
                      <div className="text-sm text-gray-500 line-clamp-1">{item.message}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeStyles(item.type)}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`h-2 w-2 rounded-full ${item.read ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                        <span className="text-sm text-gray-500">{item.read ? 'Read' : 'Unread'}</span>
                      </div>
                      {item.actioned !== undefined && (
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`h-2 w-2 rounded-full ${item.actioned ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                          <span className="text-sm text-gray-500">{item.actioned ? 'Actioned' : 'Not actioned'}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.timeAgo || format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {!loading && !error && notifications.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{notifications.length}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-md border ${
                currentPage === 1
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-md border ${
                currentPage === totalPages
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationDashboard;