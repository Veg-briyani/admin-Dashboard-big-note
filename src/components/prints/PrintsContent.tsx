import React, { useState, useEffect } from 'react';
import { Printer, Plus, RefreshCw, AlertCircle, Loader, Calendar, Hash, FileText, 
  DollarSign, BookOpen, Search, ChevronDown, CheckCircle, Clock, XCircle, Eye, Info } from 'lucide-react';
import api from '../../services/api';

// Define interfaces for our data
interface Book {
  _id: string;
  title: string;
  isbn: string;
  totalRevenue: number | null;
  id?: string;
}

interface PrintLog {
  _id: string;
  bookId: string | Book;
  printDate: string;
  quantity: number;
  pressName: string;
  cost: number;
  edition: string;
  authorId: string;
  __v?: number;
}

// Add CSS for animations
const animationStyles = `
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-scaleIn {
  animation: scaleIn 0.2s ease-out forwards;
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}
`;

// Add a style tag to inject our animations
const StyleTag = () => (
  <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
);

// Tooltip component for better UX
interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip = ({ text, children }: TooltipProps) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        {text}
      </div>
    </div>
  );
};

// Status Badge component
const StatusBadge = ({ status }: { status: string }) => {
  let config = {
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-200',
    icon: null as React.ReactNode | null
  };

  switch (status) {
    case 'Completed':
      config = {
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-200',
        icon: <CheckCircle size={14} className="text-emerald-500 mr-1" />
      };
      break;
    case 'In Progress':
      config = {
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-200',
        icon: <Clock size={14} className="text-amber-500 mr-1" />
      };
      break;
    case 'Scheduled':
      config = {
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        icon: <Calendar size={14} className="text-blue-500 mr-1" />
      };
      break;
    default:
      config = {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-200',
        icon: <AlertCircle size={14} className="text-gray-500 mr-1" />
      };
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
      {config.icon}
      {status}
    </span>
  );
};

// Empty State component
const EmptyState = () => (
  <div className="py-16 flex flex-col items-center justify-center text-center px-4">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <Printer size={32} className="text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-800 mb-2">No print logs found</h3>
    <p className="text-gray-500 max-w-md mb-6">
      There are no print logs available in the system. Add your first print log to start tracking book production.
    </p>
    <div className="inline-block">
      <span className="inline-flex rounded-md shadow-sm">
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <Plus size={16} className="mr-2" />
          Add Your First Print Log
        </button>
      </span>
    </div>
  </div>
);

// Error State component
const ErrorState = ({ error, onRetry }: { error: string, onRetry: () => void }) => (
  <div className="py-16 flex flex-col items-center justify-center text-center px-4">
    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
      <AlertCircle size={32} className="text-red-500" />
    </div>
    <h3 className="text-lg font-semibold text-gray-800 mb-2">Error loading print logs</h3>
    <p className="text-gray-600 mb-6 max-w-md">
      {error}
    </p>
    <button 
      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
      onClick={onRetry}
    >
      <RefreshCw size={16} className="mr-2" />
      Try Again
    </button>
  </div>
);

// Loading State component 
const LoadingState = () => (
  <div className="py-16 flex flex-col items-center justify-center">
    <div className="w-16 h-16 flex items-center justify-center mb-4">
      <Loader size={36} className="text-indigo-600 animate-spin" />
    </div>
    <p className="text-gray-600 font-medium">Loading print logs...</p>
    <p className="text-gray-500 text-sm mt-1">This may take a moment</p>
  </div>
);

// Table Skeleton Loader
const TableRowSkeleton = () => {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <tr key={i} className="animate-pulse border-b">
          <td className="py-4 px-4">
            <div className="h-4 bg-gray-200 rounded w-40"></div>
          </td>
          <td className="py-4 px-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </td>
          <td className="py-4 px-4">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </td>
          <td className="py-4 px-4">
            <div className="h-4 bg-gray-200 rounded w-28"></div>
          </td>
          <td className="py-4 px-4">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </td>
          <td className="py-4 px-4">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </td>
          <td className="py-4 px-4">
            <div className="h-6 bg-gray-200 rounded w-20"></div>
          </td>
          <td className="py-4 px-4">
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </td>
        </tr>
      ))}
    </>
  );
};

// Alert component
const Alert = ({ type, message, title }: { type: 'success' | 'error'; message: string; title?: string }) => {
  const configs = {
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      icon: <CheckCircle size={20} className="text-green-500" />
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      icon: <AlertCircle size={20} className="text-red-500" />
    }
  };

  const config = configs[type];

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 mb-6`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {config.icon}
        </div>
        <div className="ml-3">
          {title && <h3 className={`text-sm font-medium ${config.textColor}`}>{title}</h3>}
          <div className={`text-sm ${config.textColor}`}>
            {message}
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal component
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  icon 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full animate-scaleIn">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {icon || <Printer size={20} className="text-indigo-600" />}
              {title}
            </h3>
            <button 
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              onClick={onClose}
              aria-label="Close"
            >
              <XCircle size={20} />
            </button>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
};

// Form Field component for consistent styling
interface FormFieldProps {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  tooltip?: string;
}

const FormField = ({ label, icon, required = false, children, tooltip }: FormFieldProps) => {
  return (
    <div>
      <label className="block text-gray-700 text-sm font-medium mb-2 flex items-center">
        {icon && <span className="mr-1">{icon}</span>}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        
        {tooltip && (
          <Tooltip text={tooltip}>
            <Info size={14} className="ml-1 text-gray-400 cursor-help" />
          </Tooltip>
        )}
      </label>
      {children}
    </div>
  );
};

// Stat Card component
const StatCard = ({ 
  title, 
  value, 
  icon, 
  subtitle 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  subtitle?: string;
}) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-800 mb-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
        {icon}
      </div>
    </div>
  </div>
);

// Main Print Logs component
const PrintsContent: React.FC = () => {
  // State variables
  const [printLogs, setPrintLogs] = useState<PrintLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    bookId: '',
    printDate: new Date().toISOString().split('T')[0],
    quantity: 500,
    pressName: 'City Press',
    cost: 5000,
    edition: 'First Edition',
  });

  // Fetch print logs on component mount
  useEffect(() => {
    fetchPrintLogs();
    fetchBooks();
  }, []);

  // Fetch print logs from API
  const fetchPrintLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/print-logs/admin/all');
      console.log('API Response:', response.data);
      
      // Ensure we're getting an array
      if (Array.isArray(response.data)) {
        setPrintLogs(response.data);
      } else if (response.data && typeof response.data === 'object') {
        // If it's an object, check if it has a data property that's an array
        if (Array.isArray(response.data.data)) {
          setPrintLogs(response.data.data);
        } else {
          // Convert to array if it's a single object
          setPrintLogs([response.data]);
        }
      } else {
        // Set empty array and show error
        setPrintLogs([]);
        setError('Invalid data format received from the server.');
      }
    } catch (err) {
      console.error('Error fetching print logs:', err);
      setError('Failed to load print logs. Please try again.');
      setPrintLogs([]); // Ensure we have an empty array
    } finally {
      // Artificial delay for UX
      setTimeout(() => setLoading(false), 600);
    }
  };

  // Fetch books for the dropdown
  const fetchBooks = async () => {
    try {
      const response = await api.get('/books/admin/all');
      setBooks(response.data);
    } catch (err) {
      console.error('Error fetching books:', err);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' || name === 'cost' ? parseInt(value) : value,
    }));
    
    // Clear the error for this field when the user makes a change
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.bookId) {
      errors.bookId = 'Please select a book';
    }
    
    if (!formData.printDate) {
      errors.printDate = 'Print date is required';
    }
    
    if (formData.quantity <= 0) {
      errors.quantity = 'Quantity must be greater than 0';
    }
    
    if (!formData.pressName.trim()) {
      errors.pressName = 'Press name is required';
    }
    
    if (formData.cost <= 0) {
      errors.cost = 'Cost must be greater than 0';
    }
    
    if (!formData.edition.trim()) {
      errors.edition = 'Edition is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      setError('Please correct the errors in the form.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await api.post('/print-logs/admin', formData);
      
      // Update the list with the new entry
      setPrintLogs((prev) => [response.data, ...prev]);
      
      // Show success state
      setSuccess(true);
      
      // Reset form after 2 seconds and close modal
      setTimeout(() => {
        setFormData({
          bookId: '',
          printDate: new Date().toISOString().split('T')[0],
          quantity: 500,
          pressName: 'City Press',
          cost: 5000,
          edition: 'First Edition',
        });
        setSuccess(false);
        setShowModal(false);
        setFormErrors({});
        
        // Refresh the list to get the fully populated entry
        fetchPrintLogs();
      }, 1500);
      
    } catch (err) {
      console.error('Error creating print log:', err);
      setError('Failed to create print log. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display with error handling
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid Date';
    }
  };

  // Get status for display with error handling
  const getStatus = (printLog: PrintLog) => {
    // Default status in case of error
    const defaultStatus = {
      label: 'Unknown',
      className: 'bg-gray-100 text-gray-800'
    };
    
    if (!printLog || !printLog.printDate) return defaultStatus;
    
    try {
      // In a real app, you might have a status field in your data
      // For this example, we're making up statuses based on the date
      const printDate = new Date(printLog.printDate);
      const today = new Date();
      
      if (isNaN(printDate.getTime())) return defaultStatus;
      
      if (printDate > today) {
        return {
          label: 'Scheduled',
          className: 'bg-blue-100 text-blue-800'
        };
      } else if (printDate.getTime() === today.getTime()) {
        return {
          label: 'In Progress',
          className: 'bg-amber-100 text-amber-800'
        };
      } else {
        return {
          label: 'Completed',
          className: 'bg-green-100 text-green-800'
        };
      }
    } catch (err) {
      console.error('Error determining status:', err);
      return defaultStatus;
    }
  };

  // Get book title - handle all possible structures
  const getBookTitle = (printLog: PrintLog) => {
    // Handle the case when bookId is an object with title property
    if (typeof printLog.bookId === 'object' && printLog.bookId !== null && 'title' in printLog.bookId) {
      return printLog.bookId.title;
    } 
    // If we have books state and bookId is a string, find the title
    else if (typeof printLog.bookId === 'string' && books.length > 0) {
      const book = books.find(b => b._id === printLog.bookId);
      return book ? book.title : 'Unknown Book';
    }
    return 'Unknown Book';
  };

  // Filter print logs based on search and status
  const filteredPrintLogs = printLogs.filter(log => {
    const bookTitle = getBookTitle(log);
    const matchesSearch = searchQuery === '' || 
      bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.pressName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.edition.toLowerCase().includes(searchQuery.toLowerCase());
    
    const status = getStatus(log).label;
    const matchesStatus = selectedStatusFilter === 'all' || status.toLowerCase() === selectedStatusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate stats
  const getStats = () => {
    const totalPrints = printLogs.length;
    const totalQuantity = printLogs.reduce((sum, log) => sum + log.quantity, 0);
    const totalCost = printLogs.reduce((sum, log) => sum + log.cost, 0);
    
    // Count by status
    const statusCounts = {
      completed: printLogs.filter(log => getStatus(log).label === 'Completed').length,
      inProgress: printLogs.filter(log => getStatus(log).label === 'In Progress').length,
      scheduled: printLogs.filter(log => getStatus(log).label === 'Scheduled').length
    };
    
    return {
      totalPrints,
      totalQuantity,
      totalCost,
      statusCounts
    };
  };

  const stats = getStats();

  // Reset form and errors when opening the modal
  const openAddModal = () => {
    setFormErrors({});
    setError(null);
    setSuccess(false);
    setShowModal(true);
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Include animation styles */}
      <StyleTag />
      
      <div className="max-w-7xl mx-auto">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Printer className="text-indigo-600" size={24} />
              Print Logs
            </h1>
            <p className="text-gray-500 mt-1">Track and manage book print runs</p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-auto">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 bg-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Search print logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search print logs"
              />
            </div>
            
            <div className="flex space-x-2">
              <button 
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                onClick={fetchPrintLogs}
                aria-label="Refresh print logs"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <button 
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
                onClick={openAddModal}
                aria-label="Add new print log"
              >
                <Plus size={16} />
                Add Print Log
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Print Runs"
            value={stats.totalPrints}
            icon={<Printer size={24} />}
          />
          <StatCard
            title="Total Books Printed"
            value={stats.totalQuantity.toLocaleString()}
            icon={<BookOpen size={24} />}
          />
          <StatCard
            title="Total Print Costs"
            value={formatCurrency(stats.totalCost)}
            icon={<DollarSign size={24} />}
          />
          <StatCard
            title="Print Status"
            value={`${stats.statusCounts.completed} Completed`}
            subtitle={`${stats.statusCounts.inProgress} In Progress, ${stats.statusCounts.scheduled} Scheduled`}
            icon={<CheckCircle size={24} />}
          />
        </div>

        {/* Status Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              selectedStatusFilter === 'all' 
                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            } transition-colors`}
            onClick={() => setSelectedStatusFilter('all')}
          >
            All
          </button>
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              selectedStatusFilter === 'completed' 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            } transition-colors flex items-center gap-1`}
            onClick={() => setSelectedStatusFilter('completed')}
          >
            <CheckCircle size={14} />
            Completed
          </button>
          <button 
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        selectedStatusFilter === 'in progress' 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      } transition-colors flex items-center gap-1`}
                      onClick={() => setSelectedStatusFilter('in progress')}
                    >
                      <Clock size={14} />
                      In Progress
                    </button>
                    <button 
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        selectedStatusFilter === 'scheduled' 
                          ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      } transition-colors flex items-center gap-1`}
                      onClick={() => setSelectedStatusFilter('scheduled')}
                    >
                      <Calendar size={14} />
                      Scheduled
                    </button>
                  </div>
          
                  {/* Main Content Area */}
                  {loading ? (
                    <LoadingState />
                  ) : error ? (
                    <ErrorState error={error} onRetry={fetchPrintLogs} />
                  ) : filteredPrintLogs.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book Title</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Print Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Press</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Edition</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredPrintLogs.map((log) => (
                            <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-4 text-sm text-gray-800 font-medium">{getBookTitle(log)}</td>
                              <td className="px-4 py-4 text-sm text-gray-600">{formatDate(log.printDate)}</td>
                              <td className="px-4 py-4 text-sm text-gray-600">{log.quantity.toLocaleString()}</td>
                              <td className="px-4 py-4 text-sm text-gray-600">{log.pressName}</td>
                              <td className="px-4 py-4 text-sm text-gray-600">{formatCurrency(log.cost)}</td>
                              <td className="px-4 py-4 text-sm text-gray-600">{log.edition}</td>
                              <td className="px-4 py-4">
                                <StatusBadge status={getStatus(log).label} />
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center space-x-2">
                                  <Tooltip text="View Details">
                                    <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 hover:text-indigo-600">
                                      <Eye size={18} />
                                    </button>
                                  </Tooltip>
                                  <Tooltip text="Edit Log">
                                    <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 hover:text-blue-600">
                                      <FileText size={18} />
                                    </button>
                                  </Tooltip>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
          
                  {/* Add Print Log Modal */}
                  <Modal 
                    isOpen={showModal} 
                    onClose={() => setShowModal(false)}
                    title="Add New Print Log"
                    icon={<Plus size={20} className="text-indigo-600" />}
                  >
                    {success && (
                      <Alert 
                        type="success" 
                        message="Print log created successfully!" 
                        title="Success" 
                      />
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <FormField 
                        label="Select Book" 
                        icon={<BookOpen size={16} className="text-gray-400" />} 
                        required
                        tooltip="Select the book being printed"
                      >
                        <select
                          name="bookId"
                          value={formData.bookId}
                          onChange={handleInputChange}
                          className={`w-full p-2 border rounded-lg ${
                            formErrors.bookId ? 'border-red-500' : 'border-gray-200'
                          }`}
                        >
                          <option value="">Select a book</option>
                          {books.map((book) => (
                            <option key={book._id} value={book._id}>
                              {book.title} (ISBN: {book.isbn})
                            </option>
                          ))}
                        </select>
                        {formErrors.bookId && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.bookId}</p>
                        )}
                      </FormField>
          
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField 
                          label="Print Date" 
                          icon={<Calendar size={16} className="text-gray-400" />} 
                          required
                        >
                          <input
                            type="date"
                            name="printDate"
                            value={formData.printDate}
                            onChange={handleInputChange}
                            className={`w-full p-2 border rounded-lg ${
                              formErrors.printDate ? 'border-red-500' : 'border-gray-200'
                            }`}
                          />
                        </FormField>
          
                        <FormField 
                          label="Edition" 
                          icon={<FileText size={16} className="text-gray-400" />} 
                          required
                        >
                          <input
                            type="text"
                            name="edition"
                            value={formData.edition}
                            onChange={handleInputChange}
                            className={`w-full p-2 border rounded-lg ${
                              formErrors.edition ? 'border-red-500' : 'border-gray-200'
                            }`}
                          />
                        </FormField>
          
                        <FormField 
                          label="Quantity" 
                          icon={<Hash size={16} className="text-gray-400" />} 
                          required
                        >
                          <input
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleInputChange}
                            className={`w-full p-2 border rounded-lg ${
                              formErrors.quantity ? 'border-red-500' : 'border-gray-200'
                            }`}
                          />
                        </FormField>
          
                        <FormField 
                          label="Press Name" 
                          icon={<Printer size={16} className="text-gray-400" />} 
                          required
                        >
                          <input
                            type="text"
                            name="pressName"
                            value={formData.pressName}
                            onChange={handleInputChange}
                            className={`w-full p-2 border rounded-lg ${
                              formErrors.pressName ? 'border-red-500' : 'border-gray-200'
                            }`}
                          />
                        </FormField>
          
                        <FormField 
                          label="Total Cost" 
                          icon={<DollarSign size={16} className="text-gray-400" />} 
                          required
                        >
                          <input
                            type="number"
                            name="cost"
                            value={formData.cost}
                            onChange={handleInputChange}
                            className={`w-full p-2 border rounded-lg ${
                              formErrors.cost ? 'border-red-500' : 'border-gray-200'
                            }`}
                          />
                        </FormField>
                      </div>
          
                      <div className="pt-4 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowModal(false)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {isSubmitting ? (
                            <Loader size={16} className="animate-spin mr-2" />
                          ) : (
                            <Plus size={16} className="mr-2" />
                          )}
                          Add Print Log
                        </button>
                      </div>
                    </form>
                  </Modal>
                </div>
              </div>
            );
          };
          
          export default PrintsContent;