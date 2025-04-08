import axios from 'axios';
import { User } from '../types/user';

// Create a custom instance of axios with default settings
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  validateStatus: (status) => {
    return status >= 200 && status < 500;
  }
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Handle token expiration
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const handleApiError = (error: unknown) => {
  console.error('API Error:', error);
  // You can add more error handling logic here
};

// Define the structure of our API object
const api = {
  // Use axios instance for standard HTTP methods
  get: (url: string, config = {}) => axiosInstance.get(url, config),
  post: (url: string, data = {}, config = {}) => axiosInstance.post(url, data, config),
  put: (url: string, data = {}, config = {}) => axiosInstance.put(url, data, config),
  delete: (url: string, config = {}) => axiosInstance.delete(url, config),
  
  // Keep the existing API methods
  kycAPI: {
    getPendingKYC: () => axiosInstance.get('/admin/kyc/pending'),
    getKYCDetail: (userId: string) => axiosInstance.get(`/admin/kyc/${userId}`),
    approveKYC: (userId: string, data: { status: string, aadhaarVerified: boolean, panVerified: boolean }) => 
      axiosInstance.post(`/admin/kyc/approve/${userId}`, data),
    rejectKYC: (userId: string, data: { rejectionReason: string }) => 
      axiosInstance.post(`/admin/kyc/reject/${userId}`, data)
  },
  // Add other specific API modules as needed
  
  // For TypeScript type-checking, ensure interceptors is available
  interceptors: axiosInstance.interceptors
};

export const getRoyaltyRequests = async (status = "pending") => {
  try {
    const response = await api.get(`/admin/royalties?status=${status}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const approveRoyaltyRequest = async (id: string) => {
  try {
    const response = await api.post(`/admin/royalties/${id}/approve`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const rejectRoyaltyRequest = async (id: string, rejectionReason: string) => {
  try {
    const response = await api.post(`/admin/royalties/${id}/reject`, {
      rejectionReason
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getAuthorsByIds = async (ids: string[]) => {
  try {
    const response = await api.get(`/admin/users?ids=${ids.join(',')}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// API endpoints for users
const userAPI = {
  getAllUsers: () => api.get('/admin/users'),
  createUser: (userData: Partial<User>) => api.post('/auth/register', userData),
  updateUser: (userId: string, userData: Partial<User>) => api.put(`/admin/users/${userId}`, userData),
  deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`)
};

// API endpoints for books
const bookAPI = {
  getAllBooks: () => api.get('/admin/books'),
  createBook: (bookData: Record<string, any>) => api.post('/admin/books/create', bookData),
  updateBook: (bookId: string, bookData: Record<string, any>) => api.put(`/admin/books/${bookId}`, bookData),
  deleteBook: (bookId: string) => api.delete(`/admin/books/${bookId}`)
};

// API endpoints for royalties
const royaltyAPI = {
  getAllRoyalties: () => api.get('/admin/royalties/all'),
  approveRoyaltyRequest: (id: string) => api.post(`/admin/royalties/${id}/approve`),
  rejectRoyaltyRequest: (id: string, rejectionReason: string) => 
    api.post(`/admin/royalties/${id}/reject`, { rejectionReason })
};

// API endpoints for orders
const orderAPI = {
  getAllOrders: () => api.get('/admin/orders'),
  updateOrderStatus: (orderId: string, status: string) => 
    api.put(`/admin/orders/${orderId}/status`, { status })
};

// Updated API endpoints for print logs
const printAPI = {
  getAllPrintLogs: () => api.get('/print-logs/admin/all'),
  createPrintLog: (data: Record<string, any>) => api.post('/print-logs/admin', data),
  updatePrintLog: (id: string, data: Record<string, any>) => api.put(`/print-logs/admin/${id}`, data),
  deletePrintLog: (id: string) => api.delete(`/print-logs/admin/${id}`),
  getPrintLogDetail: (id: string) => api.get(`/print-logs/admin/${id}`)
};

// API endpoints for notifications
const notificationAPI = {
  sendAdminNotification: (data: { authorId: string, message: string }) => 
    api.post('/notifications/admin', data)
};

export default {
  ...api,
  userAPI,
  bookAPI,
  royaltyAPI,
  orderAPI,
  printAPI,
  notificationAPI
};