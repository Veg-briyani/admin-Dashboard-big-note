import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import api from '../../services/api';
import { User } from '../../types/user';

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
  const [newYear, setNewYear] = useState('');
  const [newMonth, setNewMonth] = useState('');
  const [revenueError, setRevenueError] = useState<string | null>(null);
  const [revenueSuccess, setRevenueSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserData();
    } else {
      setUser(null);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, userId]);

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
      onUserUpdated();

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user. Please try again.');
      setLoading(false);
    }
  };

  const handleUpdateRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevenueError(null);
    setRevenueSuccess(null);

    if (!newYear || !newMonth || !newRevenue) {
      setRevenueError('Please fill all fields');
      return;
    }

    try {
      await api.put(
        `/admin/users/${userId}/yearlyPerformance/${newYear}/monthlyRevenue/${newMonth}`,
        { revenue: parseFloat(newRevenue) }
      );

      setRevenueSuccess('Revenue updated successfully');
      setNewRevenue('');
      setNewYear('');
      setNewMonth('');

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
    } catch (err: any) {
      console.error('Revenue update error:', err);
      setRevenueError(err.response?.data?.message || 'Failed to update revenue');
    }
  };

  if (!isOpen) return null;

  // Render modal using React Portal to avoid nesting inside other forms.
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit User</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            &times;
          </button>
        </div>

        {loading && !user ? (
          <div className="text-center py-8">Loading user data...</div>
        ) : error && !success ? (
          <div className="bg-red-100 text-red-800 p-3 rounded mb-4">{error}</div>
        ) : success ? (
          <div className="bg-green-100 text-green-800 p-3 rounded mb-4">{success}</div>
        ) : (
          <>
            {/* Main user update form */}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="author">Author</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KYC Status</label>
                  <select
                    name="kycStatus"
                    value={formData.kycStatus}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Active Account
                  </label>
                </div>
              </div>
              <div className="mb-4">
                <h3 className="text-md font-medium mb-2">Profile Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      name="profileTitle"
                      value={formData.profileTitle}
                      onChange={handleInputChange}
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      name="profileLocation"
                      value={formData.profileLocation}
                      onChange={handleInputChange}
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    name="profileBio"
                    value={formData.profileBio}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2 h-20"
                  />
                </div>
              </div>
              <div className="mb-4">
                <h3 className="text-md font-medium mb-2">Financial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Wallet Balance</label>
                    <div className="flex items-center">
                      <span className="mr-1">₹</span>
                      <input
                        type="number"
                        name="walletBalance"
                        value={formData.walletBalance}
                        onChange={handleInputChange}
                        className="w-full border rounded-md px-3 py-2"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Outstanding Royalty</label>
                    <div className="flex items-center">
                      <span className="mr-1">₹</span>
                      <input
                        type="number"
                        name="outstandingRoyalty"
                        value={formData.outstandingRoyalty}
                        onChange={handleInputChange}
                        className="w-full border rounded-md px-3 py-2"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Royalty Received</label>
                    <div className="flex items-center">
                      <span className="mr-1">₹</span>
                      <input
                        type="number"
                        name="royaltyReceived"
                        value={formData.royaltyReceived}
                        onChange={handleInputChange}
                        className="w-full border rounded-md px-3 py-2"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Update User
              </button>
            </form>

            {/* Revenue update form */}
            {user && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <h3 className="text-md font-medium mb-2">Update Monthly Revenue</h3>
                <form onSubmit={handleUpdateRevenue} className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Year"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    className="w-20 px-2 py-1 border rounded"
                    min="2000"
                    max="2100"
                  />
                  <input
                    type="number"
                    placeholder="Month"
                    value={newMonth}
                    onChange={(e) => setNewMonth(e.target.value)}
                    className="w-20 px-2 py-1 border rounded"
                    min="1"
                    max="12"
                  />
                  <input
                    type="number"
                    placeholder="Revenue"
                    value={newRevenue}
                    onChange={(e) => setNewRevenue(e.target.value)}
                    className="w-32 px-2 py-1 border rounded"
                    step="0.01"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Update
                  </button>
                </form>
                {revenueError && (
                  <div className="text-red-500 mt-2">{revenueError}</div>
                )}
                {revenueSuccess && (
                  <div className="text-green-500 mt-2">{revenueSuccess}</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default EditUserModal;
