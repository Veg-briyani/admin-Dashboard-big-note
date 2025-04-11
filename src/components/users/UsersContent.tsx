import { useState, useEffect } from 'react';
import api from '../../services/api';
import EditUserModal from './EditUserModal';
import AddUserModal from './AddUserModal';
import { User } from '../../types/user';
import { 
  Search, 
  PlusCircle, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Loader, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle,
  UserPlus,
  Users as UsersIcon,
  Mail,
  MoreHorizontal,
  X,
  Settings,
  UserCheck,
  ExternalLink
} from 'lucide-react';

const UsersContent = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // State for add modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // State for action menu
  const [actionMenuUser, setActionMenuUser] = useState<string | null>(null);

  // Function to fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role.toLowerCase() === selectedRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Handle page changes
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // Handle opening the edit modal
  const handleEditUser = (userId: string) => {
    setSelectedUserId(userId);
    setIsEditModalOpen(true);
    setActionMenuUser(null);
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);
      // Show success message
      setSuccessMessage('User deleted successfully!');
      // Refresh the users list
      fetchUsers();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user. Please try again.');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
    
    setActionMenuUser(null);
  };

  // Get status display for a user
  const getUserStatus = (user: User) => {
    if (!user.isActive) {
      return { 
        label: 'Suspended', 
        className: 'bg-red-100 text-red-800 border border-red-200',
        icon: <X size={12} className="mr-1" />
      };
    }
    
    // If KYC status is pending, show that
    if (user.kycStatus === 'pending') {
      return { 
        label: 'Pending KYC', 
        className: 'bg-amber-100 text-amber-800 border border-amber-200',
        icon: <Settings size={12} className="mr-1 animate-spin-slow" />
      };
    }
    
    // Otherwise, user is active
    return { 
      label: 'Active', 
      className: 'bg-green-100 text-green-800 border border-green-200',
      icon: <UserCheck size={12} className="mr-1" />
    };
  };

  // Handle user added or updated
  const handleUserUpdated = () => {
    fetchUsers();
    setSuccessMessage('User updated successfully!');
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };
  
  const handleUserAdded = () => {
    fetchUsers();
    setSuccessMessage('User added successfully!');
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  // Generate pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxButtonsToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxButtonsToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);
    
    if (endPage - startPage + 1 < maxButtonsToShow) {
      startPage = Math.max(1, endPage - maxButtonsToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => paginate(i)}
          className={`w-9 h-9 rounded-full flex items-center justify-center ${
            currentPage === i
              ? 'bg-indigo-600 text-white font-medium shadow-sm'
              : 'text-gray-700 hover:bg-indigo-50 transition-colors'
          }`}
        >
          {i}
        </button>
      );
    }
    
    return buttons;
  };

  // Toggle action menu
  const toggleActionMenu = (userId: string) => {
    if (actionMenuUser === userId) {
      setActionMenuUser(null);
    } else {
      setActionMenuUser(userId);
    }
  };

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActionMenuUser(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="animate-fadeIn">
      {/* Success message toast notification */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-white border-l-4 border-green-500 text-green-700 p-4 rounded-lg shadow-lg z-50 animate-fadeIn flex items-center max-w-md">
          <CheckCircle className="h-5 w-5 mr-3 text-green-500 flex-shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}
      
      {/* Error toast notification */}
      {error && (
        <div className="fixed top-4 right-4 bg-white border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-lg z-50 animate-fadeIn flex items-center max-w-md">
          <AlertCircle className="h-5 w-5 mr-3 text-red-500 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <div className="mr-3 p-2 rounded-lg bg-indigo-100 text-indigo-600">
              <UsersIcon size={24} />
            </div>
            User Management
          </h2>
          <p className="text-gray-500 mt-1">Manage user accounts and permissions</p>
        </div>
        <button 
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow flex items-center gap-2"
          onClick={() => setIsAddModalOpen(true)}
        >
          <UserPlus size={18} />
          <span>Add New User</span>
        </button>
      </div>

      {/* Search and filter bar */}
      <div className="bg-white rounded-xl shadow-sm mb-6 p-4 flex flex-col sm:flex-row justify-between gap-4 border border-gray-100">
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search users..."
            className="pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500">
              <Filter size={18} />
            </div>
            <select 
              className="border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-gray-700"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="author">Authors</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          
          <button 
            onClick={fetchUsers}
            className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-gray-200"
            title="Refresh users"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Main content card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        {/* Table container */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 relative">
                  <div className="absolute inset-0 bg-indigo-100 rounded-full opacity-30 animate-ping"></div>
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Loader size={32} className="animate-spin text-indigo-600" />
                  </div>
                </div>
                <span className="text-gray-600 font-medium mt-4">Loading users...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <p className="text-gray-800 font-medium mb-4">{error}</p>
              <button 
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                onClick={fetchUsers}
              >
                Try Again
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.length > 0 ? (
                  currentItems.map((user) => {
                    const status = getUserStatus(user);
                    
                    return (
                      <tr key={user._id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold mr-3 relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
                              <span>{user.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">{user.name}</div>
                              {user.createdAt && (
                                <div className="text-xs text-gray-500">
                                  Joined {new Date(user.createdAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-gray-600 group-hover:text-indigo-600 transition-colors">
                            <Mail size={14} className="mr-2 text-gray-400 group-hover:text-indigo-400 transition-colors" />
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium 
                            ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 
                              'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`${status.className} text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="relative inline-block">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleActionMenu(user._id);
                              }}
                              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                            >
                              <MoreHorizontal size={18} />
                            </button>
                            
                            {actionMenuUser === user._id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10 border border-gray-100 animate-fadeIn" 
                                   onClick={(e) => e.stopPropagation()}>
                                <button 
                                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center"
                                  onClick={() => handleEditUser(user._id)}
                                >
                                  <Edit size={16} className="mr-2 text-gray-400" />
                                  Edit User
                                </button>
                                <button 
                                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center"
                                  onClick={() => handleDeleteUser(user._id)}
                                >
                                  <Trash2 size={16} className="mr-2 text-red-400" />
                                  Delete User
                                </button>
                                <hr className="my-2 border-gray-100" />
                                <button 
                                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center"
                                >
                                  <ExternalLink size={16} className="mr-2 text-gray-400" />
                                  View Profile
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="max-w-sm mx-auto">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <UsersIcon size={32} className="text-indigo-400" />
                        </div>
                        <p className="text-gray-800 font-medium mb-2">No users found</p>
                        <p className="text-gray-500 mb-4">We couldn't find any users matching your search criteria.</p>
                        {searchQuery && (
                          <button 
                            className="mt-2 text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center mx-auto"
                            onClick={() => setSearchQuery('')}
                          >
                            <X size={16} className="mr-1" />
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && filteredUsers.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50">
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium text-gray-800">{indexOfFirstItem + 1}</span> to{' '}
              <span className="font-medium text-gray-800">{Math.min(indexOfLastItem, filteredUsers.length)}</span> of{' '}
              <span className="font-medium text-gray-800">{filteredUsers.length}</span> users
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={goToPrevPage} 
                disabled={currentPage === 1}
                className={`w-9 h-9 flex items-center justify-center rounded-full ${
                  currentPage === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-indigo-50 transition-colors'
                }`}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex gap-1">
                {renderPaginationButtons()}
              </div>
              
              <button 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages}
                className={`w-9 h-9 flex items-center justify-center rounded-full ${
                  currentPage === totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-indigo-50 transition-colors'
                }`}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <EditUserModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userId={selectedUserId}
        onUserUpdated={handleUserUpdated}
      />
      
      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserAdded={handleUserAdded}
      />

      {/* Add custom animation for the spinning cog */}
      <style jsx global>{`
        .animate-spin-slow {
          animation: spin 2s linear infinite;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default UsersContent;