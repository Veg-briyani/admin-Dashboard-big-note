export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  kycStatus?: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
  phoneNumber?: string;
  walletBalance?: number;
  outstandingRoyalty?: number;
  royaltyReceived?: number;
  profile?: {
    title?: string;
    location?: string;
    bio?: string;
  };
  bankAccount?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  yearlyPerformance?: Array<{
    year: string;
    monthlyRevenue: Array<{
      month: string;
      revenue: number;
    }>;
  }>;
  createdAt?: string;
  updatedAt?: string;
} 