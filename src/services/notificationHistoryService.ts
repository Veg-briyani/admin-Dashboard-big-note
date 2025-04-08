import api from './api';

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
}

export interface AdminNotificationItem {
  _id: string;
  recipient?: {
    _id: string;
    name: string;
    email: string;
    id: string;
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
  id: string;
}

export interface PaginationData {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface NotificationHistoryResponse {
  history: NotificationHistoryItem[];
  pagination: PaginationData;
}

export interface AdminNotificationResponse {
  notifications: AdminNotificationItem[];
  pagination: PaginationData;
}

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
      const response = await api.post('/api/notifications/history', data);
      return response.data;
    } catch (error) {
      console.error('Failed to log notification history:', error);
      // Don't throw error here - this is a logging function and shouldn't
      // block the main notification sending process
    }
  },

  // Get notification history with filters
  getNotificationHistory: async (params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    type?: string;
  }) => {
    const response = await api.get('/notifications/history', { params });
    return response.data as NotificationHistoryResponse;
  },

  // Get admin notifications with filters
  getAdminNotifications: async (params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    type?: string;
  }) => {
    const response = await api.get('/notifications/admin', { params });
    return response.data as AdminNotificationResponse;
  }
};

export default notificationHistoryService;