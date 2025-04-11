import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  X, 
  Loader, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Mail, 
  Lock, 
  UserCheck, 
  Phone, 
  MapPin, 
  Briefcase, 
  FileText,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onUserAdded }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

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

      // Check password strength
      if (name === 'password') {
        calculatePasswordStrength(value);
      }
    }
  };

  const calculatePasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    
    // Character variety checks
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    setPasswordStrength(strength);
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return { text: 'Too weak', color: 'bg-gray-200' };
    if (passwordStrength === 1) return { text: 'Weak', color: 'bg-red-500' };
    if (passwordStrength === 2) return { text: 'Fair', color: 'bg-orange-500' };
    if (passwordStrength === 3) return { text: 'Good', color: 'bg-yellow-500' };
    if (passwordStrength === 4) return { text: 'Strong', color: 'bg-green-500' };
    return { text: 'Very strong', color: 'bg-green-600' };
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
        setCurrentStep(1);
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

  // Reset step when modal opens
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

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 2));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // When modal is closed, don't render anything
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div 
        className="bg-white rounded-xl p-0 w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Add New User</h2>
              <p className="text-gray-500 text-sm">Create a new user account</p>
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
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 relative mb-4">
              <div className="absolute inset-0 bg-indigo-100 rounded-full opacity-50 animate-ping"></div>
              <div className="relative w-full h-full flex items-center justify-center">
                <Loader size={32} className="animate-spin text-indigo-600" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Creating New User</h3>
            <p className="text-gray-500">Please wait while we set up the account...</p>
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
                onClick={() => setError(null)}
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
            <h3 className="text-lg font-medium text-gray-800 mb-2">User Created Successfully</h3>
            <p className="text-gray-500 mb-6">The new user account has been created.</p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Steps indicator */}
            <div className="px-6 pt-4 pb-6">
              <div className="flex items-center justify-between w-full max-w-xs mx-auto">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  1
                </div>
                <div 
                  className={`h-1 flex-1 mx-2 ${
                    currentStep >= 2 ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                ></div>
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  2
                </div>
              </div>
              <div className="flex justify-between mt-2 text-sm max-w-xs mx-auto">
                <span className={currentStep === 1 ? 'text-indigo-600 font-medium' : 'text-gray-500'}>Account Details</span>
                <span className={currentStep === 2 ? 'text-indigo-600 font-medium' : 'text-gray-500'}>Profile Information</span>
              </div>
            </div>
            
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              {/* Step 1: User Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User size={16} className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
                          placeholder="John Doe"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
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
                          placeholder="john.doe@example.com"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock size={16} className="text-gray-400" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
                          placeholder="••••••••••••"
                          required
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      
                      {/* Password strength meter */}
                      {formData.password && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">Password strength:</span>
                            <span className="text-xs font-medium" style={{ color: getPasswordStrengthColor() }}>
                              {getPasswordStrengthLabel().text}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getPasswordStrengthLabel().color} transition-all duration-300`} 
                              style={{ width: `${(passwordStrength / 5) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
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
                          <ChevronRight size={16} className="text-gray-400" style={{ transform: 'rotate(90deg)' }} />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
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
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        KYC Status
                      </label>
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
                          <ChevronRight size={16} className="text-gray-400" style={{ transform: 'rotate(90deg)' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center mt-2">
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
              )}
              
              {/* Step 2: Profile Information */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Professional Title
                      </label>
                      <span className="text-xs text-gray-500">Optional</span>
                    </div>
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
                        placeholder="e.g. Senior Software Engineer"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Location
                      </label>
                      <span className="text-xs text-gray-500">Optional</span>
                    </div>
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
                        placeholder="e.g. San Francisco, CA"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Bio
                      </label>
                      <span className="text-xs text-gray-500">Optional</span>
                    </div>
                    <textarea
                      name="profileBio"
                      value={formData.profileBio}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors resize-none"
                      placeholder="Tell us a bit about this user..."
                      rows={4}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Error message */}
            {error && !success && (
              <div className="px-6 py-3">
                <div className="bg-red-50 text-red-800 p-3 rounded-lg flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5 text-red-500 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
            
            {/* Form actions */}
            <div className="px-6 py-4 bg-gray-50 flex justify-between border-t border-gray-100">
              {currentStep === 1 ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Back
                </button>
              )}
              
              {currentStep === 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center"
                >
                  Next
                  <ChevronRight size={16} className="ml-1" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Create User
                </button>
              )}
            </div>
          </form>
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
    </div>
  );
};

function getPasswordStrengthColor() {
  const strength = document.querySelector('input[name="password"]')?.value?.length || 0;
  if (strength === 0) return '#9ca3af'; // Gray
  if (strength < 8) return '#ef4444'; // Red
  if (strength < 10) return '#f97316'; // Orange
  if (strength < 12) return '#eab308'; // Yellow
  if (strength < 14) return '#22c55e'; // Green
  return '#16a34a'; // Dark Green
}

export default AddUserModal;