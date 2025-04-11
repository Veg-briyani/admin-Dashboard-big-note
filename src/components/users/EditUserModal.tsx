import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import api from '../../services/api';
import { User } from '../../types/user';
import { 
  X, 
  Loader, 
  CheckCircle, 
  AlertCircle, 
  User as UserIcon, 
  Mail, 
  UserCheck, 
  Phone, 
  MapPin, 
  Briefcase, 
  FileText,
  DollarSign,
  Calendar,
  Edit,
  Save,
  CreditCard,
  PieChart,
  Award,
  Layers,
  BarChart2,
  Clipboard,
  Clock
} from 'lucide-react';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  onUserUpdated: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, userId, onUserUpdated }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  // Form state for user details
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'author',
    isActive: true,
    kycStatus: 'pending',
    phoneNumber: '',
    profileTitle: '',
    profileLocation: '',
    profileBio: '',
    walletBalance: '0',
    outstandingRoyalty: '0',
    royaltyReceived: '0',
  });

  // State for revenue update
  const [newRevenue, setNewRevenue] = useState('');
  const [newYear, setNewYear] = useState(new Date().getFullYear().toString());
  const [newMonth, setNewMonth] = useState((new Date().getMonth() + 1).toString());
  const [revenueError, setRevenueError] = useState<string | null>(null);
  const [revenueSuccess, setRevenueSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserData();
    } else {
      setUser(null);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, userId]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const fetchUserData = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/admin/users/${userId}`);
      const userData = response.data;
      setUser(userData);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        role: userData.role || 'author',
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        kycStatus: userData.kycStatus || 'pending',
        phoneNumber: userData.phoneNumber || '',
        profileTitle: userData.profile?.title || '',
        profileLocation: userData.profile?.location || '',
        profileBio: userData.profile?.bio || '',
        walletBalance: userData.walletBalance?.toString() || '0',
        outstandingRoyalty: userData.outstandingRoyalty?.toString() || '0',
        royaltyReceived: userData.royaltyReceived?.toString() || '0',
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user data. Please try again.');
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
        kycStatus: formData.kycStatus,
        phoneNumber: formData.phoneNumber,
        profile: {
          title: formData.profileTitle,
          location: formData.profileLocation,
          bio: formData.profileBio,
        },
        walletBalance: parseFloat(formData.walletBalance),
        outstandingRoyalty: parseFloat(formData.outstandingRoyalty),
        royaltyReceived: parseFloat(formData.royaltyReceived),
      };

      await api.put(`/admin/users/${userId}`, updateData);
      setSuccess('User updated successfully');
      setLoading(false);
      setSubmitting(false);
      onUserUpdated();

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user. Please try again.');
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleUpdateRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevenueError(null);
    setRevenueSuccess(null);
    setSubmitting(true);

    if (!newYear || !newMonth || !newRevenue) {
      setRevenueError('Please fill all fields');
      setSubmitting(false);
      return;
    }

    try {
      await api.put(
        `/admin/users/${userId}/yearlyPerformance/${newYear}/monthlyRevenue/${newMonth}`,
        { revenue: parseFloat(newRevenue) }
      );

      setRevenueSuccess('Revenue updated successfully');
      setSubmitting(false);

      // Update user state with new revenue data
      setUser(prev => {
        if (!prev) return prev;
        const newRevenueNum = parseFloat(newRevenue);
        const yearlyPerformance = prev.yearlyPerformance ? [...prev.yearlyPerformance] : [];
        const yearIndex = yearlyPerformance.findIndex(y => y.year === newYear);
        if (yearIndex !== -1) {
          const monthlyRevenue = [...yearlyPerformance[yearIndex].monthlyRevenue];
          const monthIndex = monthlyRevenue.findIndex(m => m.month === newMonth);
          if (monthIndex !== -1) {
            monthlyRevenue[monthIndex] = { ...monthlyRevenue[monthIndex], revenue: newRevenueNum };
          } else {
            monthlyRevenue.push({ month: newMonth, revenue: newRevenueNum });
          }
          yearlyPerformance[yearIndex] = { 
            ...yearlyPerformance[yearIndex], 
            monthlyRevenue 
          };
        } else {
          yearlyPerformance.push({ 
            year: newYear, 
            monthlyRevenue: [{ month: newMonth, revenue: newRevenueNum }] 
          });
        }
        return { ...prev, yearlyPerformance };
      });

      // Clear form after successful update
      setTimeout(() => {
        setRevenueSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Revenue update error:', err);
      setRevenueError(err.response?.data?.message || 'Failed to update revenue');
      setSubmitting(false);
    }
  };

  const getMonthName = (monthNum: string) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[parseInt(monthNum) - 1] || monthNum;
  };

  if (!isOpen) return null;

  // Render modal using React Portal to avoid nesting inside other forms.
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3">
              <Edit size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Edit User</h2>
              {user && (
                <p className="text-gray-500 text-sm truncate">
                  {user.email}
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Loading state */}
        {loading && !user ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 relative mb-4">
              <div className="absolute inset-0 bg-indigo-100 rounded-full opacity-50 animate-ping"></div>
              <div className="relative w-full h-full flex items-center justify-center">
                <Loader size={32} className="animate-spin text-indigo-600" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Loading User Data</h3>
            <p className="text-gray-500">Please wait while we fetch the user information...</p>
          </div>
        ) : error && !success ? (
          <div className="p-6">
            <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-4 flex items-start">
              <AlertCircle className="h-5 w-5 mr-3 mt-0.5 text-red-500 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Error</h3>
                <p>{error}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={fetchUserData}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">User Updated Successfully</h3>
            <p className="text-gray-500 mb-6">The user information has been updated.</p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Tabs navigation */}
            <div className="px-6 pt-4 border-b border-gray-100">
              <div className="flex space-x-2">
                <button
                  className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('profile')}
                >
                  <div className="flex items-center">
                    <UserIcon size={16} className="mr-2" />
                    Profile
                  </div>
                </button>
                <button
                  className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${
                    activeTab === 'finance'
                      ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('finance')}
                >
                  <div className="flex items-center">
                    <DollarSign size={16} className="mr-2" />
                    Finance
                  </div>
                </button>
                <button
                  className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${
                    activeTab === 'revenue'
                      ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('revenue')}
                >
                  <div className="flex items-center">
                    <BarChart2 size={16} className="mr-2" />
                    Revenue
                  </div>
                </button>
              </div>
            </div>

            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-md font-medium mb-3 text-gray-700 flex items-center">
                        <Clipboard size={16} className="mr-2 text-indigo-500" />
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <UserIcon size={16} className="text-gray-400" />
                            </div>
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Mail size={16} className="text-gray-400" />
                            </div>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <UserCheck size={16} className="text-gray-400" />
                            </div>
                            <select
                              name="role"
                              value={formData.role}
                              onChange={handleInputChange}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pl-10 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
                            >
                              <option value="author">Author</option>
                              <option value="admin">Admin</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Phone size={16} className="text-gray-400" />
                            </div>
                            <input
                              type="text"
                              name="phoneNumber"
                              value={formData.phoneNumber}
                              onChange={handleInputChange}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">KYC Status</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FileText size={16} className="text-gray-400" />
                            </div>
                            <select
                              name="kycStatus"
                              value={formData.kycStatus}
                              onChange={handleInputChange}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pl-10 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isActive"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                            Active Account
                          </label>
                        </div>
                      </div>
                    </div>
                  
                    <div>
                      <h3 className="text-md font-medium mb-3 text-gray-700 flex items-center">
                        <Layers size={16} className="mr-2 text-indigo-500" />
                        Profile Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Professional Title</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Briefcase size={16} className="text-gray-400" />
                            </div>
                            <input
                              type="text"
                              name="profileTitle"
                              value={formData.profileTitle}
                              onChange={handleInputChange}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
                              placeholder="e.g. Senior Designer"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <MapPin size={16} className="text-gray-400" />
                            </div>
                            <input
                              type="text"
                              name="profileLocation"
                              value={formData.profileLocation}
                              onChange={handleInputChange}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
                              placeholder="e.g. New York, NY"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea
                          name="profileBio"
                          value={formData.profileBio}
                          onChange={handleInputChange}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
                          rows={4}
                          placeholder="User biography..."
                        />
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {/* Finance Tab */}
              {activeTab === 'finance' && (
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-md font-medium mb-3 text-gray-700 flex items-center">
                        <PieChart size={16} className="mr-2 text-indigo-500" />
                        Financial Information
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Balance</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <CreditCard size={16} className="text-gray-400" />
                            </div>
                            <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none">
                              <span className="text-gray-500">₹</span>
                            </div>
                            <input
                              type="number"
                              name="walletBalance"
                              value={formData.walletBalance}
                              onChange={handleInputChange}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pl-14 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Outstanding Royalty</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Clock size={16} className="text-gray-400" />
                            </div>
                            <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none">
                              <span className="text-gray-500">₹</span>
                            </div>
                            <input
                              type="number"
                              name="outstandingRoyalty"
                              value={formData.outstandingRoyalty}
                              onChange={handleInputChange}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pl-14 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Royalty Received</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Award size={16} className="text-gray-400" />
                            </div>
                            <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none">
                              <span className="text-gray-500">₹</span>
                            </div>
                            <input
                              type="number"
                              name="royaltyReceived"
                              value={formData.royaltyReceived}
                              onChange={handleInputChange}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pl-14 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              )}
              
              {/* Revenue Tab */}
              {activeTab === 'revenue' && (
                <div>
                  <h3 className="text-md font-medium mb-3 text-gray-700 flex items-center">
                    <BarChart2 size={16} className="mr-2 text-indigo-500" />
                    Monthly Revenue Management
                  </h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Update Monthly Revenue</h4>
                    <form onSubmit={handleUpdateRevenue} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Calendar size={14} className="text-gray-400" />
                            </div>
                            <input
                              type="number"
                              placeholder="Year"
                              value={newYear}
                              onChange={(e) => setNewYear(e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 pl-9 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
                              min="2000"
                              max="2100"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
                          <select
                            value={newMonth}
                            onChange={(e) => setNewMonth(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
                            required
                          >
                            {Array.from({ length: 12 }, (_, i) => (
                              <option key={i + 1} value={(i + 1).toString()}>
                                {getMonthName((i + 1).toString())}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Revenue Amount (₹)</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <DollarSign size={14} className="text-gray-400" />
                            </div>
                            <input
                              type="number"
                              placeholder="Amount"
                              value={newRevenue}
                              onChange={(e) => setNewRevenue(e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 pl-9 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
                              step="0.01"
                              min="0"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      
                      {revenueError && (
                        <div className="bg-red-50 text-red-600 p-2 rounded-lg text-sm flex items-center">
                          <AlertCircle size={14} className="mr-2" />
                          {revenueError}
                        </div>
                      )}
                      
                      {revenueSuccess && (
                        <div className="bg-green-50 text-green-600 p-2 rounded-lg text-sm flex items-center">
                          <CheckCircle size={14} className="mr-2" />
                          {revenueSuccess}
                        </div>
                      )}
                      
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {submitting ? (
                            <>
                              <Loader size={14} className="animate-spin mr-2" />
                              Updating...
                            </>
                          ) : (
                            <>
                              Update Revenue
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                  
                  {/* Revenue History */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Revenue History</h4>
                    {user?.yearlyPerformance && user.yearlyPerformance.length > 0 ? (
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue (₹)</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {user.yearlyPerformance.flatMap(yearly => 
                                yearly.monthlyRevenue.map((monthly, idx) => (
                                  <tr key={`${yearly.year}-${monthly.month}-${idx}`} className="hover:bg-gray-50">
                                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700">{yearly.year}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700">{getMonthName(monthly.month)}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">₹{monthly.revenue.toFixed(2)}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <p className="text-gray-500">No revenue history available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Form actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              
              {activeTab !== 'revenue' && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader size={14} className="animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        )}
        
        {/* Custom animation for the modal */}
        <style jsx global>{`
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-in-out;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>,
    document.body
  );
};

export default EditUserModal;