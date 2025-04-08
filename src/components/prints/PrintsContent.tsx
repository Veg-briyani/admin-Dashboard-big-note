import React, { useState, useEffect } from 'react';
import { Printer, Plus, RefreshCw, AlertCircle, Loader, Calendar, Hash, FileText, DollarSign, BookOpen } from 'lucide-react';
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

const PrintsContent: React.FC = () => {
  // State variables
  const [printLogs, setPrintLogs] = useState<PrintLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [books, setBooks] = useState<Book[]>([]);

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
      setLoading(false);
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
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      return new Date(dateString).toLocaleDateString();
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

  // Get author name (for simplicity, assuming each print log has author data)
  

  return (
    <div className="px-6 py-6 max-w-full">
      {/* Header with actions */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Printer className="text-indigo-600" size={28} />
            Print Logs
          </h2>
          <p className="text-gray-500 mt-1">Track and manage book print runs</p>
        </div>
        <div className="flex gap-2">
          <button 
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
            onClick={fetchPrintLogs}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button 
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
            onClick={() => setShowModal(true)}
          >
            <Plus size={18} />
            Add New Print Log
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader size={36} className="text-indigo-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading print logs...</p>
          </div>
        ) : error ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4">
            <AlertCircle size={36} className="text-red-500 mb-3" />
            <h3 className="text-gray-800 font-medium mb-1">Error loading print logs</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              onClick={fetchPrintLogs}
            >
              Try Again
            </button>
          </div>
        ) : printLogs.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4">
            <Printer size={48} className="text-gray-300 mb-3" />
            <h3 className="text-gray-800 font-medium mb-1">No print logs found</h3>
            <p className="text-gray-500 max-w-md">
              There are no print logs available. Click the "Add New Print Log" button to create one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 font-medium text-gray-700">Book Title</th>

                  <th className="pb-3 font-medium text-gray-700">Print Date</th>
                  <th className="pb-3 font-medium text-gray-700">Quantity</th>
                  <th className="pb-3 font-medium text-gray-700">Press</th>
                  <th className="pb-3 font-medium text-gray-700">Edition</th>
                  <th className="pb-3 font-medium text-gray-700">Cost</th>
                  <th className="pb-3 font-medium text-gray-700">Status</th>
                  <th className="pb-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(printLogs) && printLogs.map((printLog) => {
                  const status = getStatus(printLog);
                  return (
                    <tr key={printLog._id} className="border-b hover:bg-gray-50">
                      <td className="py-3">{getBookTitle(printLog)}</td>
                      <td className="py-3">{formatDate(printLog.printDate)}</td>
                      <td className="py-3">{printLog.quantity?.toLocaleString() || '0'}</td>
                      <td className="py-3">{printLog.pressName || 'N/A'}</td>
                      <td className="py-3">{printLog.edition || 'N/A'}</td>
                      <td className="py-3">₹{printLog.cost?.toLocaleString() || '0'}</td>
                      <td className="py-3">
                        <span className={`${status.className} text-xs font-medium px-2 py-1 rounded`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3">
                        <button className="text-blue-600 hover:text-blue-800">
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Print Log Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Printer size={20} className="text-indigo-600" />
                  Add New Print Log
                </h3>
                <button 
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting || success}
                >
                  &times;
                </button>
              </div>
              
              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 flex items-start">
                  <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                  <div>{error}</div>
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4 flex items-start">
                  <Printer size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Print log created successfully!</p>
                    <p className="text-sm mt-1">The print log has been added to the system.</p>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      <BookOpen size={14} className="inline mr-1" />
                      Select Book*
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      name="bookId"
                      value={formData.bookId}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting || success}
                    >
                      <option value="">Select a book</option>
                      {books.map((book) => (
                        <option key={book._id} value={book._id}>
                          {book.title}
                        </option>
                      ))}
                      {books.length === 0 && (
                        <option disabled>Loading books...</option>
                      )}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        <Calendar size={14} className="inline mr-1" />
                        Print Date*
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        name="printDate"
                        value={formData.printDate}
                        onChange={handleInputChange}
                        required
                        disabled={isSubmitting || success}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        <Hash size={14} className="inline mr-1" />
                        Quantity*
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        min="1"
                        required
                        disabled={isSubmitting || success}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        <FileText size={14} className="inline mr-1" />
                        Press Name*
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        name="pressName"
                        value={formData.pressName}
                        onChange={handleInputChange}
                        required
                        disabled={isSubmitting || success}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        <DollarSign size={14} className="inline mr-1" />
                        Cost (₹)*
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        name="cost"
                        value={formData.cost}
                        onChange={handleInputChange}
                        min="1"
                        required
                        disabled={isSubmitting || success}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Edition*
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      name="edition"
                      value={formData.edition}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting || success}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowModal(false)}
                      disabled={isSubmitting || success}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`px-4 py-2 rounded-lg flex items-center ${
                        success 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      } text-white`}
                      disabled={isSubmitting || success}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader size={16} className="animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : success ? (
                        <>
                          <Printer size={16} className="mr-2" />
                          Print Log Created
                        </>
                      ) : (
                        <>
                          <Printer size={16} className="mr-2" />
                          Create Print Log
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintsContent;