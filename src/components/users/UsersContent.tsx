import { useState, useEffect } from 'react';
import api from '../../services/api';
import EditUserModal from './EditUserModal';
import AddUserModal from './AddUserModal';
import { User } from '../../types/user';
import { Search, PlusCircle, Edit, Trash2, ChevronLeft, ChevronRight, Filter, Loader } from 'lucide-react';

const UsersContent = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // State for add modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);
      // Refresh the users list
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  // Get status display for a user
  const getUserStatus = (user: User) => {
    if (!user.isActive) {
      return { label: 'Suspended', className: 'bg-red-100 text-red-800 border border-red-200' };
    }
    
    // If KYC status is pending, show that
    if (user.kycStatus === 'pending') {
      return { label: 'Pending KYC', className: 'bg-amber-100 text-amber-800 border border-amber-200' };
    }
    
    // Otherwise, user is active
    return { label: 'Active', className: 'bg-green-100 text-green-800 border border-green-200' };
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
          className={`w-8 h-8 rounded-md flex items-center justify-center ${
            currentPage === i
              ? 'bg-indigo-600 text-white font-medium'
              : 'text-gray-700 border border-gray-300 hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }
    
    return buttons;
  };

  return (
    <div className="px-6 py-6 max-w-full">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
          <p className="text-gray-500 mt-1">Manage user accounts and permissions</p>
        </div>
        <button 
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
          onClick={() => setIsAddModalOpen(true)}
        >
          <PlusCircle size={18} />
          <span>Add New User</span>
        </button>
      </div>

      {/* Main content card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Search and filter bar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select 
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="all">All Users</option>
              <option value="author">Authors</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {/* Table container */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size={24} className="animate-spin text-indigo-600 mr-3" />
              <span className="text-gray-600 font-medium">Loading users...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-2">
                <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-800 font-medium">{error}</p>
              <button 
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                onClick={fetchUsers}
              >
                Try Again
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left bg-gray-50">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItems.length > 0 ? (
                  currentItems.map((user) => {
                    const status = getUserStatus(user);
                    
                    return (
                      <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-9 h-9 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-full flex items-center justify-center text-white font-semibold shadow-sm mr-3">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">{user.name}</div>
                              {user.createdAt && (
                                <div className="text-xs text-gray-500">
                                  Joined {new Date(user.createdAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium 
                            ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 
                              'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`${status.className} text-xs font-medium px-3 py-1 rounded-full`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-3">
                            <button 
                              className="text-indigo-600 hover:text-indigo-900 font-medium flex items-center"
                              onClick={() => handleEditUser(user._id)}
                            >
                              <Edit size={16} className="mr-1" />
                              Edit
                            </button>
                            <button 
                              className="text-red-600 hover:text-red-900 font-medium flex items-center"
                              onClick={() => handleDeleteUser(user._id)}
                            >
                              <Trash2 size={16} className="mr-1" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-gray-500 mb-2">
                        <svg className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 font-medium">No users found matching your search criteria</p>
                      {searchQuery && (
                        <button 
                          className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
                          onClick={() => setSearchQuery('')}
                        >
                          Clear search
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && filteredUsers.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} users
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={goToPrevPage} 
                disabled={currentPage === 1}
                className={`w-8 h-8 flex items-center justify-center rounded-md ${
                  currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex gap-1">
                {renderPaginationButtons()}
              </div>
              
              <button 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages}
                className={`w-8 h-8 flex items-center justify-center rounded-md ${
                  currentPage === totalPages
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
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
        onUserUpdated={fetchUsers}
      />
      
      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserAdded={fetchUsers}
      />
    </div>
  );
};

export default UsersContent;