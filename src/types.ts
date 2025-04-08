// Core entity interfaces
export interface FakePurchase {
  _id: string;
  customerName: string;
  bookTitle: string;
  price: number;
  status: 'pending' | 'completed';
  authorId: string | Author;
  createdAt: string;
  updatedAt: string;
}

export interface Author {
  _id: string;
  name: string;
  email: string;
  role: 'author' | 'admin';
  kycStatus: 'pending' | 'approved' | 'rejected';
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}

// Filter interfaces
export interface FakePurchaseFilters {
  authorId?: string;
  status?: 'pending' | 'completed';
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
}

// Notification interfaces
export interface Notification {
  _id: string;
  recipient: string | Author;
  message: string;
  type: 'system' | 'payout' | 'order' | 'admin';
  read: boolean;
  createdAt: string;
}

// User management interfaces
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'author' | 'admin';
  isActive: boolean;
  phoneNumber: string;
  kycStatus: 'pending' | 'approved' | 'rejected';
  walletBalance: number;
  outstandingRoyalty: number;
  royaltyReceived: number;
  profile?: {
    title?: string;
    location?: string;
    bio?: string;
  };
}

// Book interfaces
export interface Book {
  _id: string;
  title: string;
  authorId: string | Author;
  price: number;
  stock: number;
  category: string;
  isbn: string;
  coverImage?: string;
  marketplaceLinks?: {
    amazon?: string;
    flipkart?: string;
  };
}

// Royalty interfaces
export interface Royalty {
  _id: string;
  authorId: string | Author;
  amount: number;
  status: 'Pending' | 'Approved' | 'Paid' | 'Rejected';
  paymentMethod: 'bank_transfer' | 'upi' | 'paypal';
  createdAt: string;
}

// Form data interfaces
export interface FakePurchaseFormData {
  customerName: string;
  bookTitle: string;
  price: number;
  status: 'pending' | 'completed';
  authorId: string;
}

// API response interfaces
export interface FakePurchasesResponse {
  purchases: FakePurchase[];
  pagination: Pagination;
}

export interface AuthorsResponse {
  authors: Author[];
} 