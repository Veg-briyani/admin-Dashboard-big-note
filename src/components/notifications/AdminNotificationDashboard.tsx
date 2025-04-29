import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  DollarSign, 
  AlertTriangle, 
  Package, 
  Users, 
  Search, 
  Check, 
  X, 
  Eye, 
  Send,
  Clock,
  Calendar,
  UserPlus,
  Loader,
  AlertCircle
} from 'lucide-react';
import notificationService, { Notification, User, adminNotificationService } from '../../services/notificationService';
import { useAuth } from '../../services/authContext'; // Assuming you have an auth context
import { toast } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';

const NotificationsContent = () => {
  // State for notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalNotifications, setTotalNotifications] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<{ [key: string]: boolean }>({});
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit] = useState<number>(10);

  // State for filtering
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(false);
  
  // State for modal
  const [showSendModal, setShowSendModal] = useState<boolean>(false);
  
  // Get current user from auth context
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // State for authors
  const [authors, setAuthors] = useState<User[]>([]);
  const [isAuthorLoading, setIsAuthorLoading] = useState(false);
  const [authorError, setAuthorError] = useState<string | null>(null);

  // Load notifications when filters change
  useEffect(() => {
    fetchNotifications();
  }, [filterType, showUnreadOnly, currentPage]);

  // Fetch authors when modal opens
  useEffect(() => {
    const fetchAuthors = async () => {
      if (showSendModal) {
        setIsAuthorLoading(true);
        setAuthorError(null);
        try {
          // Call the service to get authors specifically
          const fetchedAuthors = await notificationService.getAuthors();
          
          console.log('Fetched authors:', fetchedAuthors);
          
          if (fetchedAuthors && Array.isArray(fetchedAuthors)) {
            setAuthors(fetchedAuthors);
            // Log number of authors fetched
            console.log(`Successfully fetched ${fetchedAuthors.length} authors`);
            
            if (fetchedAuthors.length === 0) {
              // Set a more informative message if no authors were found
              setAuthorError('No authors found in the system. Please make sure there are users with the author role.');
            }
          } else {
            console.error('Authors data is not an array:', fetchedAuthors);
            setAuthorError('Failed to load authors: Invalid data format');
          }
        } catch (err: unknown) {
          console.error('Error fetching authors:', err);
          const message = err instanceof Error ? err.message : 'Failed to load author list';
          setAuthorError(message);
          toast.error('Failed to load author list');
        } finally {
          setIsAuthorLoading(false);
        }
      }
    };
    
    fetchAuthors();
  }, [showSendModal]);

  // Fetch notifications based on current filters
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: Record<string, string | number | boolean> = {
        page: currentPage,
        limit
      };
      
      // Add filters if set
      if (filterType !== 'all') {
        params.type = filterType;
      }
      
      if (showUnreadOnly) {
        params.read = false;
      }
      
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      const response = await notificationService.getNotifications(params);
      
      setNotifications(response.notifications);
      setTotalNotifications(response.pagination.total);
      setTotalPages(response.pagination.pages);
    } catch (err: unknown) {
      console.error('Error fetching notifications:', err);
      const message = err instanceof Error ? err.message : 'Failed to load notifications';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Manual fetch authors function for debugging
  const debugFetchAuthors = async () => {
    try {
      setIsAuthorLoading(true);
      setAuthorError(null);
      
      const fetchedAuthors = await notificationService.getAuthors();
      console.log('Debug - Fetched authors:', fetchedAuthors);
      
      if (fetchedAuthors && Array.isArray(fetchedAuthors)) {
        setAuthors(fetchedAuthors);
        toast.success(`Fetched ${fetchedAuthors.length} authors`);
      } else {
        setAuthorError('Authors data is not in the expected format');
        toast.error('Error: Invalid author data format');
      }
    } catch (err: unknown) {
      console.error('Debug - Error fetching authors:', err);
      const message = err instanceof Error ? err.message : 'Error fetching authors';
      setAuthorError(message);
      toast.error('Failed to load authors');
    } finally {
      setIsAuthorLoading(false);
    }
  };

  // Search handler with debounce
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    
    // Reset to first page when searching
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      // If already on first page, manually trigger fetch
      fetchNotifications();
    }
  };

  // Handle notification action (approve, reject, review, etc.)
  const handleAction = async (notificationId: string, action: string) => {
    try {
      // Set action in progress
      setActionInProgress(prev => ({ ...prev, [notificationId]: true }));
      
      // Process the action
      await notificationService.processAction(notificationId, action);
      
      // Update the notification in the list
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification._id === notificationId 
            ? { 
                ...notification, 
                read: true, 
                actioned: true, 
                actionTaken: action 
              } 
            : notification
        )
      );
      
      toast.success(`Action ${action} processed successfully`);
    } catch (err: unknown) {
      console.error(`Error processing ${action} action:`, err);
      const message = err instanceof Error ? err.message : `Failed to process ${action}`;
      toast.error(message);
    } finally {
      // Clear action in progress
      setActionInProgress(prev => ({ ...prev, [notificationId]: false }));
    }
  };

  // Mark a notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Error marking all as read:', err);
      toast.error('Failed to mark all as read');
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payout':
        return <DollarSign size={20} />;
      case 'kyc':
        return <AlertTriangle size={20} />;
      case 'order':
        return <Package size={20} />;
      case 'author':
        return <Users size={20} />;
      case 'system':
        return <Bell size={20} />;
      case 'admin':
        return <UserPlus size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  // Get background color for notification icon
  const getIconBackground = (type: string) => {
    switch (type) {
      case 'payout':
        return 'bg-indigo-100 text-indigo-600';
      case 'kyc':
        return 'bg-amber-100 text-amber-600';
      case 'order':
        return 'bg-green-100 text-green-600';
      case 'author':
        return 'bg-purple-100 text-purple-600';
      case 'system':
        return 'bg-blue-100 text-blue-600';
      case 'admin':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Get action button based on notification type and action
  const getActionButton = (action: string, notification: Notification) => {
    const isProcessing = actionInProgress[notification._id] || false;
    
    // Base button styles
    const baseClassName = "flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors";
    const buttonStyle = isProcessing ? 
      `${baseClassName} opacity-50 cursor-not-allowed` : 
      baseClassName;
    
    switch (action) {
      case 'approve':
        return (
          <button 
            className={`${buttonStyle} bg-green-600 hover:bg-green-700 text-white`}
            onClick={() => handleAction(notification._id, 'approve')}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader size={14} className="mr-1 animate-spin" />
            ) : (
              <Check size={14} className="mr-1" />
            )}
            Approve
          </button>
        );
      case 'reject':
        return (
          <button 
            className={`${buttonStyle} bg-red-600 hover:bg-red-700 text-white`}
            onClick={() => handleAction(notification._id, 'reject')}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader size={14} className="mr-1 animate-spin" />
            ) : (
              <X size={14} className="mr-1" />
            )}
            Reject
          </button>
        );
      case 'review':
        return (
          <button 
            className={`${buttonStyle} bg-indigo-600 hover:bg-indigo-700 text-white`}
            onClick={() => handleAction(notification._id, 'review')}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader size={14} className="mr-1 animate-spin" />
            ) : (
              <Eye size={14} className="mr-1" />
            )}
            Review
          </button>
        );
      case 'view':
        return (
          <button 
            className={`${buttonStyle} bg-indigo-600 hover:bg-indigo-700 text-white`}
            onClick={() => handleAction(notification._id, 'view')}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader size={14} className="mr-1 animate-spin" />
            ) : (
              <Eye size={14} className="mr-1" />
            )}
            View Profile
          </button>
        );
      default:
        return null;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Determine actions based on notification type
  const getNotificationActions = (notification: Notification) => {
    // If already actioned, don't show actions
    if (notification.actioned) {
      return [];
    }
    
    // Return actions based on type
    switch (notification.type) {
      case 'payout':
        return ['approve', 'reject'];
      case 'kyc':
        return ['review'];
      case 'author':
        return ['view'];
      default:
        return [];
    }
  };

  // Pagination component
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center mt-4">
        <div className="flex space-x-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded ${
              currentPage === 1 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Previous
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Calculate page numbers to show
            let pageNum = 1;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage + 2 >= totalPages) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-md flex items-center justify-center ${
                  currentPage === pageNum 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded ${
              currentPage === totalPages 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // Error fallback component
  function ErrorFallback({ error, resetErrorBoundary }: { 
    error: Error;
    resetErrorBoundary: () => void;
  }) {
    return (
      <div role="alert" className="p-4 bg-red-100 text-red-700 rounded-lg">
        <p>Something went wrong:</p>
        <pre>{error.message}</pre>
        <button 
          onClick={resetErrorBoundary}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 max-w-full">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Bell className="text-indigo-600" size={28} />
            Notifications
          </h2>
          <p className="text-gray-500 mt-1">Stay updated with system alerts and user activities</p>
        </div>
        {isAdmin && (
          <button 
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
            onClick={() => setShowSendModal(true)}
          >
            <Send size={18} />
            Send New Notification
          </button>
        )}
      </div>

      {/* Filters and search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search notifications..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <select 
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="payout">Payouts</option>
              <option value="kyc">KYC</option>
              <option value="order">Orders</option>
              <option value="author">Authors</option>
              <option value="system">System</option>
              <option value="admin">Admin</option>
            </select>
            
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="unreadOnly" 
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                checked={showUnreadOnly}
                onChange={() => setShowUnreadOnly(!showUnreadOnly)}
              />
              <label htmlFor="unreadOnly" className="ml-2 text-sm text-gray-700">
                Unread only
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-200">
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
              onClick={fetchNotifications}
            >
              Try Again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4">
            <Bell size={48} className="text-gray-300 mb-3" />
            <h3 className="text-gray-800 font-medium mb-1">No notifications found</h3>
            <p className="text-gray-500 max-w-md">
              {searchQuery || filterType !== 'all' || showUnreadOnly ? 
                'Try changing your filters to see more notifications.' : 
                'You have no notifications at this time. New notifications will appear here.'}
            </p>
            {(searchQuery || filterType !== 'all' || showUnreadOnly) && (
              <button 
                className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                  setShowUnreadOnly(false);
                }}
              >
                Reset all filters
              </button>
            )}
          </div>
        ) : (
          <div>
            {notifications.map((notification) => {
              // Determine notification actions
              const actions = getNotificationActions(notification);
              
              return (
                <div 
                  key={notification._id} 
                  className={`p-5 hover:bg-gray-50 transition-colors ${!notification.read ? 'border-l-4 border-indigo-500' : ''}`}
                  onClick={() => !notification.read && markAsRead(notification._id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getIconBackground(notification.type)} mr-4 shadow-sm`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 flex items-center">
                          {notification.title}
                          {!notification.read && <span className="ml-2 h-2 w-2 bg-indigo-500 rounded-full"></span>}
                        </h3>
                        <p className="text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <Clock size={14} className="mr-1" />
                          {notification.timeAgo}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <div className="text-xs text-gray-500 whitespace-nowrap mb-2">
                        <Calendar size={14} className="inline mr-1" />
                        {formatDate(notification.createdAt)}
                      </div>
                      {!notification.read && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          New
                        </span>
                      )}
                      {notification.actioned && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                          {notification.actionTaken ? 
                            `${notification.actionTaken.charAt(0).toUpperCase()}${notification.actionTaken.slice(1)}ed` : 
                            'Processed'
                          }
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {actions.length > 0 && (
                    <div className="mt-4 flex justify-end space-x-3">
                      {actions.map((action) => (
                        <div key={action}>
                          {getActionButton(action, notification)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {!loading && !error && notifications.length > 0 && renderPagination()}
      
      {/* Footer with count */}
      {!loading && !error && notifications.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 flex justify-between items-center">
          <div>
            Showing {notifications.length} of {totalNotifications} notifications
          </div>
          <button 
            className="text-indigo-600 hover:text-indigo-800 font-medium"
            onClick={markAllAsRead}
          >
            Mark all as read
          </button>
        </div>
      )}
      
      {/* Send Notification Modal */}
      {showSendModal && isAdmin && (
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onReset={() => setShowSendModal(false)}
        >
          <SendNotificationModal 
            onClose={() => setShowSendModal(false)}
            onSend={fetchNotifications}
            isAuthorLoading={isAuthorLoading}
            authors={authors || []}
            authorError={authorError}
            onRetryFetchAuthors={debugFetchAuthors}
          />
        </ErrorBoundary>
      )}
    </div>
  );
};

// Send notification modal component
interface SendNotificationModalProps {
  onClose: () => void;
  onSend: () => void;
  isAuthorLoading: boolean;
  authors: User[];
  authorError: string | null;
  onRetryFetchAuthors: () => void;
}

const SendNotificationModal = ({ 
  onClose, 
  onSend,
  isAuthorLoading,
  authors = [],
  authorError,
  onRetryFetchAuthors
}: SendNotificationModalProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    authorId: '',
    title: '',
    message: '',
    notificationType: 'admin' as 'admin' | 'system' | 'payout' | 'kyc' | 'order' | 'author' | 'other'
  });
  const [error, setError] = useState<string | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      if (!formData.authorId) {
        setError('Please select an author');
        setLoading(false);
        return;
      }
      
      if (!formData.title.trim() || !formData.message.trim()) {
        setError('Title and message are required');
        setLoading(false);
        return;
      }
      
      // Send notification
      await adminNotificationService.sendAdminNotification({
        authorId: formData.authorId,
        title: formData.title,
        message: formData.message,
        type: formData.notificationType,
      });
      
      // Show success message
      toast.success('Notification sent successfully');
      setSuccess(true);
      
      // Close modal and refresh notifications after a short delay
      setTimeout(() => {
        onClose();
        onSend();
      }, 1500);
    } catch (err: unknown) {
      console.error('Error sending notification:', err);
      const message = err instanceof Error ? err.message : 'Failed to send notification';
      setError(message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Send size={20} className="text-indigo-600" />
              Send Notification
            </h3>
            <button 
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              onClick={onClose}
            >
              &times;
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 flex items-start">
              <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <div>{error}</div>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4 flex items-start">
              <Check size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Notification sent successfully!</p>
                <p className="text-sm mt-1">The notification has been delivered to the selected author.</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Select Author*
                </label>
                <div className="relative">
                  {authorError ? (
                    <div className="p-4 bg-amber-50 text-amber-700 rounded-lg flex items-start">
                      <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p>{authorError}</p>
                        <button
                          type="button"
                          className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                          onClick={onRetryFetchAuthors}
                        >
                          <Loader size={14} className="mr-2" />
                          Retry Loading Authors
                        </button>
                      </div>
                    </div>
                  ) : (
                    <select
                      id="authorId"
                      name="authorId"
                      value={formData.authorId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                      disabled={isAuthorLoading}
                    >
                      <option value="">Select an author</option>
                      {isAuthorLoading ? (
                        <option disabled>Loading authors...</option>
                      ) : authors.length === 0 ? (
                        <option disabled>No authors available</option>
                      ) : (
                        authors.map(author => (
                          <option key={author._id} value={author._id}>
                            {author.name} {author.email ? `(${author.email})` : ''}
                          </option>
                        ))
                      )}
                    </select>
                  )}
                  {isAuthorLoading && (
                    <div className="absolute right-3 top-3">
                      <Loader className="animate-spin text-indigo-600" size={16} />
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  name="notificationType"
                  value={formData.notificationType}
                  onChange={handleInputChange}
                >
                  <option value="admin">Admin</option>
                  <option value="system">System</option>
                  <option value="author">Author</option>
                  <option value="payout">Payout</option>
                  <option value="order">Order</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Title*
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Message*
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  required
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    success 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } text-white`}
                  disabled={loading || success || (authors.length === 0 && !authorError)}
                >
                  {loading ? (
                    <>
                      <Loader size={16} className="animate-spin mr-2" />
                      Sending...
                    </>
                  ) : success ? (
                    <>
                      <Check size={16} className="mr-2" />
                      Sent Successfully
                    </>
                  ) : (
                    <>
                      <Send size={16} className="mr-2" />
                      Send Notification
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NotificationsContent;