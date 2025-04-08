import api from './api'; // Your base API service

/**
 * Common interfaces
 */
export interface PaginationData {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface FilterParams {
  type?: string;
  read?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
  id?: string;
}

/**
 * User notification interfaces
 */
export interface Recipient {
  _id: string;
  name: string;
  email: string;
  id?: string;
}

export interface Notification {
  _id: string;
  recipient: string | Recipient;
  title: string;
  message: string;
  type: 'admin' | 'system' | 'payout' | 'kyc' | 'order' | 'author' | 'other';
  read: boolean;
  data?: any;
  actioned?: boolean;
  actionTaken?: string;
  actionData?: any;
  actionedAt?: string;
  actionedBy?: string;
  createdAt: string;
  updatedAt: string;
  timeAgo?: string; // Virtual property from backend
  id?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: PaginationData;
}

/**
 * Admin notification interfaces
 */
export interface AdminNotificationItem {
  _id: string;
  recipient?: {
    _id: string;
    name: string;
    email: string;
    id?: string;
  };
  title?: string;
  message: string;
  type: string;
  read: boolean;
  actioned: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  timeAgo?: string;
  id?: string;
}

export interface AdminNotificationResponse {
  notifications: AdminNotificationItem[];
  pagination: PaginationData;
}

/**
 * Notification history interfaces
 */
export interface NotificationHistoryItem {
  _id: string;
  admin: {
    _id: string;
    name: string;
    email: string;
  };
  recipients: string[];
  recipientCount: number;
  title: string;
  message: string;
  type: 'admin' | 'system' | 'payout' | 'kyc' | 'order' | 'author' | 'other';
  data?: any;
  status: 'success' | 'partial' | 'failed';
  failedRecipients?: string[];
  errorDetails?: string;
  createdAt: string;
  updatedAt: string;
  id?: string;
}

export interface NotificationHistoryResponse {
  history: NotificationHistoryItem[];
  pagination: PaginationData;
}

/**
 * User-facing notification service
 */
const notificationService = {
  // Get filtered notifications
  getNotifications: async (params: FilterParams = {}) => {
    try {
      const response = await api.get('/notifications/filtered', { params });
      return response.data as NotificationResponse;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data.count as number;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  // Mark a single notification as read
  markAsRead: async (id: string) => {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      return response.data as Notification;
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await api.put('/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Process an action on a notification
  processAction: async (id: string, action: string, data?: any) => {
    try {
      const response = await api.post(`/notifications/${id}/action`, {
        action,
        data
      });
      return response.data;
    } catch (error) {
      console.error(`Error processing action ${action} on notification ${id}:`, error);
      throw error;
    }
  },

  // Mark notification as actioned (convenience method)
  markAsActioned: async (id: string) => {
    try {
      const response = await api.put(`/notifications/${id}/action`);
      return response.data as Notification;
    } catch (error) {
      console.error(`Error marking notification ${id} as actioned:`, error);
      throw error;
    }
  },

  // Delete a notification
  deleteNotification: async (id: string) => {
    try {
      const response = await api.delete(`/notifications/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting notification ${id}:`, error);
      throw error;
    }
  },

  // Get authors with role 'author'
  getAuthors: async () => {
    try {
      const response = await api.get('/admin/users', {
        params: { role: 'author' }
      });
      return response.data.users || response.data || [];
    } catch (error) {
      console.error('Error fetching authors:', error);
      throw error;
    }
  }
};

/**
 * Admin notification service
 */
export const adminNotificationService = {
  // Send a notification (admin only)
  sendNotification: async (data: {
    recipientId: string;
    title: string;
    message: string;
    type?: string;
    data?: any;
  }) => {
    try {
      // Remove any tracking or history-related fields
      const cleanedData = {
        recipientId: data.recipientId,
        title: data.title,
        message: data.message,
        type: data.type || 'admin',
        data: data.data
      };

      const response = await api.post('/notifications/send', cleanedData);

      // Log to history if successful
      await notificationHistoryService.logNotificationHistory({
        recipients: [data.recipientId],
        title: data.title,
        message: data.message,
        type: data.type || 'admin',
        data: data.data
      });

      return response.data;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  },

  // Send bulk notifications (admin only)
  sendBulkNotifications: async (data: {
    recipients: string[];
    title: string;
    message: string;
    type: string;
    data?: any;
  }) => {
    try {
      // Remove any tracking or history-related fields
      const cleanedData = {
        recipients: data.recipients,
        title: data.title,
        message: data.message,
        type: data.type || 'admin',
        data: data.data
      };

      const response = await api.post('/notifications/bulk', cleanedData);

      // Log to history if successful
      await notificationHistoryService.logNotificationHistory({
        recipients: data.recipients,
        title: data.title,
        message: data.message,
        type: data.type,
        data: data.data
      });

      return response.data;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  },

  // Get users for recipient selection
  getUsers: async (search?: string) => {
    try {
      const response = await api.get<{ users: User[] }>('/admin/users', {
        params: { search, limit: 1000 }
      });
      return response.data.users || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  // Get only authors (users with author role) for recipient selection
  getAuthors: async (search?: string) => {
    try {
      const response = await api.get<{ users: User[] }>('/admin/users', {
        params: { role: 'author', search, limit: 1000 }
      });

      if (response.data && response.data.users && Array.isArray(response.data.users)) {
        return response.data.users;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Error fetching authors:', error);
      return [];
    }
  },

  // Get admin notifications with filters
  getAdminNotifications: async (params: FilterParams = {}) => {
    try {
      const response = await api.get('/notifications/admin', { params });
      return response.data as AdminNotificationResponse;
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      throw error;
    }
  },

  // Send admin notification
  sendAdminNotification: async (data: {
    authorId: string;
    title: string;
    message: string;
    type?: string;
    data?: any;
  }) => {
    try {
      const response = await api.post('/notifications/admin', {
        authorId: data.authorId,
        title: data.title,
        message: data.message,
        type: data.type || 'admin',
        data: data.data
      });
      
      return response.data;
    } catch (error) {
      console.error('Error sending admin notification:', error);
      throw error;
    }
  },
};

/**
 * Notification history service
 */
const notificationHistoryService = {
  // Log a notification to history when sent by admin
  logNotificationHistory: async (data: {
    recipients: string[];
    title: string;
    message: string;
    type: string;
    data?: any;
  }) => {
    try {
      const response = await api.post('/notifications/history', data);
      return response.data;
    } catch (error) {
      console.error('Failed to log notification history:', error);
      // Don't throw error here - this is a logging function
    }
  },

  // Get notification history with filters
  getNotificationHistory: async (params: FilterParams = {}) => {
    try {
      const response = await api.get('/notifications/history', { params });
      return response.data as NotificationHistoryResponse;
    } catch (error) {
      console.error('Error fetching notification history:', error);
      throw error;
    }
  }
};

export {
  notificationService,
  notificationHistoryService
};

// For backward compatibility
export default notificationService;