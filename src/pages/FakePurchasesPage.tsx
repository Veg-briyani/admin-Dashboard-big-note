// src/pages/Admin/FakePurchases.js
import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Book, 
  DollarSign, 
  Loader,
  X,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search
} from 'lucide-react';

// Add interface for Author type
interface Author {
  _id: string;
  name: string;
}

// Add interface for Purchase type
interface Purchase {
  _id: string;
  customerName: string;
  bookTitle: string;
  price: number;
  status: 'completed' | 'pending';
  authorId: Author;
  createdAt: string;
}

// Stats interface
interface PurchaseStats {
  totalPurchases: number;
  completedAmount: number;
  completedCount: number;
  pendingAmount: number;
  pendingCount: number;
}

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

const FakePurchasesPage = () => {
  const [fakePurchases, setFakePurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPurchase, setCurrentPurchase] = useState<Purchase | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<ToastProps | null>(null);
  const [stats, setStats] = useState<PurchaseStats>({
    totalPurchases: 0,
    completedAmount: 0,
    completedCount: 0,
    pendingAmount: 0,
    pendingCount: 0
  });
  
  const [formData, setFormData] = useState({
    customerName: '',
    bookTitle: '',
    price: 0,
    status: 'completed' as 'completed' | 'pending',
    authorId: ''
  });

  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    fetchData();
  }, []);

  // Handle click outside to close modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleCloseDialog();
      }
    }

    if (dialogOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Set initial focus after modal opens
      setTimeout(() => {
        if (initialFocusRef.current) {
          initialFocusRef.current.focus();
        }
      }, 100);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dialogOpen]);
  
  // Filter purchases when status filter, search query, or purchases data changes
  useEffect(() => {
    let result = fakePurchases;
    
    // Apply status filter
    if (selectedStatus !== 'all') {
      result = result.filter(p => p.status === selectedStatus);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.customerName.toLowerCase().includes(query) || 
        p.bookTitle.toLowerCase().includes(query) || 
        (p.authorId && p.authorId.name.toLowerCase().includes(query))
      );
    }
    
    setFilteredPurchases(result);
  }, [selectedStatus, searchQuery, fakePurchases]);
  
  // Calculate stats when filtered data changes
  useEffect(() => {
    calculateStats(fakePurchases);
  }, [fakePurchases]);
  
  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, toast.duration || 3000);
      
      return () => clearTimeout(timer);
    }
  }, [toast]);
  
  const showToast = (message: string, type: 'success' | 'error' | 'info', duration = 3000) => {
    setToast({ message, type, duration });
  };
  
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get fake purchases from admin endpoint
      const purchasesRes = await api.get('/admin/fake-purchases');
      // Get authors from admin endpoint
      const authorsRes = await api.get('/admin/authors');

      // Handle API response structure
      const purchases = (
        (Array.isArray(purchasesRes.data?.purchases) && purchasesRes.data.purchases) ||
        (Array.isArray(purchasesRes.data) && purchasesRes.data) || 
        []
      ).filter((item: Purchase) => item !== null);

      const authorsList = (
        (Array.isArray(authorsRes.data?.authors) && authorsRes.data.authors) ||
          (Array.isArray(authorsRes.data) && authorsRes.data) || 
          []
      ).filter((item: Author) => item !== null);

      setFakePurchases(purchases);
      setAuthors(authorsList);
      calculateStats(purchases);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate statistics
  const calculateStats = (data: Purchase[]) => {
    if (!Array.isArray(data)) {
      console.error('Invalid data passed to calculateStats:', data);
      return;
    }
    
    const totalPurchases = data.length;
    const completedPurchases = data.filter(p => p.status === 'completed');
    const pendingPurchases = data.filter(p => p.status === 'pending');
    
    const completedAmount = completedPurchases.reduce((sum, p) => sum + p.price, 0);
    const completedCount = completedPurchases.length;
    
    const pendingAmount = pendingPurchases.reduce((sum, p) => sum + p.price, 0);
    const pendingCount = pendingPurchases.length;
    
    setStats({
      totalPurchases,
      completedAmount,
      completedCount,
      pendingAmount,
      pendingCount
    });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const name = e.target.name as keyof typeof formData;
    const value = e.target.value;
    
    // Handle price specially to ensure it's a number
    if (name === 'price' && typeof value === 'string') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Close modal on Escape key
    if (e.key === 'Escape') {
      handleCloseDialog();
    }
    
    // Submit form on Ctrl+Enter or Command+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit();
    }
  };
  
  const handleOpenDialog = (purchase: Purchase | null = null) => {
    if (purchase) {
      setCurrentPurchase(purchase);
      setFormData({
        customerName: purchase.customerName,
        bookTitle: purchase.bookTitle,
        price: purchase.price,
        status: purchase.status,
        authorId: purchase.authorId._id
      });
    } else {
      setCurrentPurchase(null);
      setFormData({
        customerName: '',
        bookTitle: '',
        price: 0,
        status: 'completed',
        authorId: authors.length > 0 ? authors[0]._id : ''
      });
    }
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setError(null); // Clear any error when closing dialog
  };
  
  const handleSubmit = async () => {
    try {
      setError(null);
      
      // Validate form data
      if (!formData.customerName || !formData.bookTitle || formData.price <= 0) {
        setError('Please fill in all required fields with valid values.');
        return;
      }
      
      if (!formData.authorId) {
        setError('Please select an author.');
        return;
      }
      
      // Show loading state
      showToast('Processing your request...', 'info');
      
      if (currentPurchase) {
        // Update existing purchase
        await api.put(`/admin/fake-purchases/${currentPurchase._id}`, formData);
        showToast('Purchase updated successfully!', 'success');
      } else {
        // Create new purchase
        await api.post('/admin/fake-purchases', formData);
        showToast('Purchase created successfully!', 'success');
      }
      
      handleCloseDialog();
      fetchData(); // Refresh data after successful operation
    } catch (error: unknown) {
      console.error('Error saving data:', error);
      
      // Show more specific error message if available
      const errorMessage = (error as any)?.response?.data?.message || 
                          'Failed to save data. Please check your inputs and try again.';
      
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this fake purchase?')) {
      try {
        setError(null);
        
        // Show loading state
        showToast('Deleting purchase...', 'info');
        
        await api.delete(`/admin/fake-purchases/${id}`);
        showToast('Purchase deleted successfully!', 'success');
        
        fetchData(); // Refresh data after successful deletion
      } catch (error: unknown) {
        console.error('Error deleting purchase:', error);
        
        const errorMessage = (error as any)?.response?.data?.message || 
                            'Failed to delete purchase. Please try again.';
        
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }
    }
  };
  
  // Get author initials for avatar
  const getAuthorInitials = (author: Author) => {
    if (!author || !author.name) return 'NA';
    return author.name.split(' ').map(part => part[0]).join('').toUpperCase();
  };
  
  // Handle status filter change
  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(event.target.value);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSelectedStatus('all');
    setSearchQuery('');
  };
  
  if (loading && fakePurchases.length === 0) {
    return (
      <div className="container mx-auto">
        <div className="flex flex-col justify-center items-center min-h-[400px]">
          <Loader className="animate-spin text-indigo-600 mb-4" size={32} />
          <p className="text-gray-600">Loading purchase data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-fade-in">
          <div 
            className={`flex items-start p-4 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-green-50 border-l-4 border-green-500' :
              toast.type === 'error' ? 'bg-red-50 border-l-4 border-red-500' :
              'bg-blue-50 border-l-4 border-blue-500'
            }`}
          >
            <div className="flex-shrink-0 mr-3">
              {toast.type === 'success' && <CheckCircle className="text-green-500" />}
              {toast.type === 'error' && <AlertTriangle className="text-red-500" />}
              {toast.type === 'info' && <Loader className="text-blue-500 animate-spin" />}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                toast.type === 'success' ? 'text-green-800' :
                toast.type === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {toast.message}
              </p>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="ml-4 text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold">Manage Fake Purchases</h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* Search input */}
          <div className="relative w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search purchases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border rounded-md pl-10 pr-4 py-2 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          {/* Status filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={handleStatusChange}
              className="border rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Filter by status"
            >
              <option value="all">All Purchases</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          {/* Create button */}
          <button 
            className="flex items-center gap-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-200"
            onClick={() => handleOpenDialog()}
            aria-label="Create fake purchase"
          >
            <Plus size={16} />
            Create Fake Purchase
          </button>
          
          {/* Refresh button */}
          <button
            onClick={fetchData}
            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors duration-200"
            aria-label="Refresh data"
            title="Refresh data"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
      
      {/* Applied filters indicator */}
      {(selectedStatus !== 'all' || searchQuery) && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-500">Applied filters:</span>
          {selectedStatus !== 'all' && (
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
              Status: {selectedStatus}
            </span>
          )}
          {searchQuery && (
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
              Search: {searchQuery}
            </span>
          )}
          <button
            onClick={resetFilters}
            className="text-xs text-indigo-600 hover:text-indigo-800 ml-2"
          >
            Clear all filters
          </button>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border hover:shadow-md transition-shadow duration-200">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Fake Purchases</p>
              <p className="text-xl font-bold">{stats.totalPurchases}</p>
              <p className="text-xs text-gray-500">
                {stats.totalPurchases} purchases in database
              </p>
            </div>
            <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <Book className="text-indigo-600" size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border hover:shadow-md transition-shadow duration-200">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed Purchases</p>
              <p className="text-xl font-bold">₹{stats.completedAmount.toFixed(2)}</p>
              <p className="text-xs text-gray-500">
                {stats.completedCount} purchases
              </p>
            </div>
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="text-green-600" size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border hover:shadow-md transition-shadow duration-200">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Purchases</p>
              <p className="text-xl font-bold">₹{stats.pendingAmount.toFixed(2)}</p>
              <p className="text-xs text-gray-500">
                {stats.pendingCount} purchases
              </p>
            </div>
            <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
              <DollarSign className="text-amber-600" size={20} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Error alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 animate-fade-in flex items-start">
          <AlertTriangle className="flex-shrink-0 mr-3 text-red-500" size={20} />
          <div>
            <p className="font-medium">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}
      
      {/* Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        {loading && (
          <div className="flex justify-center p-8">
            <Loader size={24} className="animate-spin text-indigo-600" />
          </div>
        )}
        
        {!loading && filteredPurchases.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Book size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="font-medium text-lg mb-2">No fake purchases found</p>
            <p className="text-sm mb-6 max-w-md mx-auto">
              {selectedStatus !== 'all' || searchQuery
                ? "No purchases match your current filters."
                : "You haven't created any fake purchases yet. Create one to get started!"}
            </p>
            
            {selectedStatus !== 'all' || searchQuery ? (
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => handleOpenDialog()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus size={16} />
                Create Your First Purchase
              </button>
            )}
          </div>
        )}
        
        {!loading && filteredPurchases.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPurchases.map((purchase: Purchase) => (
                  <tr key={purchase._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium mr-2 shadow-sm">
                          {getAuthorInitials(purchase.authorId)}
                        </div>
                        <span className="truncate max-w-[120px]" title={purchase.authorId.name}>
                          {purchase.authorId.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="truncate max-w-[120px] block" title={purchase.customerName}>
                        {purchase.customerName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="truncate max-w-[150px] block" title={purchase.bookTitle}>
                        {purchase.bookTitle}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      ₹{purchase.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center ${
                          purchase.status === 'completed' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                          purchase.status === 'completed' ? 'bg-green-600' : 'bg-amber-600'
                        }`}></span>
                        {purchase.status === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(purchase.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handleOpenDialog(purchase)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          aria-label={`Edit ${purchase.bookTitle}`}
                          title="Edit purchase"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(purchase._id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          aria-label={`Delete ${purchase.bookTitle}`}
                          title="Delete purchase"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Modal/Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onKeyDown={handleKeyDown}>
          <div 
            ref={modalRef}
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 bg-gray-50 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {currentPurchase ? 'Edit Fake Purchase' : 'Create Fake Purchase'}
              </h3>
              <button 
                onClick={handleCloseDialog} 
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200 flex items-start">
                  <AlertTriangle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="space-y-4">
                {!currentPurchase && (
                  <div>
                    <label 
                      htmlFor="authorId"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Author <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="authorId"
                      name="authorId"
                      value={formData.authorId}
                      onChange={handleInputChange}
                      className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select an author</option>
                      {authors.length > 0 ? (
                        authors.map((author) => (
                          <option key={author._id} value={author._id}>
                            {author.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>Loading authors...</option>
                      )}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Select the author who will see this purchase
                    </p>
                  </div>
                )}
                
                <div>
                  <label 
                    htmlFor="customerName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="customerName"
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    ref={initialFocusRef}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Name of the customer who made the purchase
                  </p>
                </div>
                
                <div>
                  <label 
                    htmlFor="bookTitle"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Book Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="bookTitle"
                    type="text"
                    name="bookTitle"
                    value={formData.bookTitle}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Title of the purchased book
                  </p>
                </div>
                
                <div>
                  <label 
                    htmlFor="price"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                    <input
                      id="price"
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full border rounded-md pl-7 p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Purchase amount in rupees
                  </p>
                </div>
                
                <div>
                  <label 
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Current status of the purchase
                  </p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleCloseDialog}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {currentPurchase ? 'Update Purchase' : 'Create Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FakePurchasesPage;