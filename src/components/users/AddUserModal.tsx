import React, { useState } from 'react';
import api from '../../services/api';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onUserAdded }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'author',
    phoneNumber: '',
    isActive: true,
    kycStatus: 'pending',
    profileTitle: '',
    profileLocation: '',
    profileBio: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkboxes
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
      // Simplify the data for registration - use only essential fields
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        // Only include role if it's not author (since author is the default)
        ...(formData.role !== 'author' && { role: formData.role })
      };
      
      console.log('Sending registration data:', userData);
      
      // Use the auth/register endpoint directly
      const response = await api.post('/auth/register', userData);
      
      console.log('User created:', response.data);
      setSuccess('User created successfully');
      
      // Additional profile updates can be done in a separate request if needed
      if (response.data && response.data.user && response.data.user._id) {
        try {
          // If we have profile data, update it separately
          if (formData.profileTitle || formData.profileLocation || formData.profileBio) {
            const profileData = {
              profile: {
                title: formData.profileTitle,
                location: formData.profileLocation,
                bio: formData.profileBio
              }
            };
            
            await api.put(`/admin/users/${response.data.user._id}`, profileData);
          }
        } catch (profileErr) {
          console.warn('Profile update failed, but user was created:', profileErr);
        }
      }
      
      setLoading(false);
      
      // Notify parent component
      onUserAdded();
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
        // Reset form
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'author',
          phoneNumber: '',
          isActive: true,
          kycStatus: 'pending',
          profileTitle: '',
          profileLocation: '',
          profileBio: '',
        });
      }, 1500);
      
    } catch (err: any) {
      console.error('Error creating user:', err);
      
      // Extract the detailed error message
      if (err.response && err.response.data) {
        const errorData = err.response.data;
        if (errorData.message) {
          setError(`Failed to create user: ${errorData.message}`);
        } else if (typeof errorData === 'string') {
          setError(`Failed to create user: ${errorData}`);
        } else {
          setError('Failed to create user. Please check your input and try again.');
        }
        console.log('Error details:', errorData);
      } else {
        setError('Failed to create user. Please try again.');
      }
      
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add New User</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">Creating user...</div>
        ) : error && !success ? (
          <div className="bg-red-100 text-red-800 p-3 rounded mb-4">{error}</div>
        ) : success ? (
          <div className="bg-green-100 text-green-800 p-3 rounded mb-4">{success}</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <h3 className="text-md font-medium mb-2">User Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    KYC Status
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    name="profileTitle"
                    value={formData.profileTitle}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  name="profileBio"
                  value={formData.profileBio}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2 h-20"
                />
              </div>
            </div>
            
            {error && !success && (
              <div className="bg-red-100 text-red-800 p-3 rounded mb-4">{error}</div>
            )}
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddUserModal; 