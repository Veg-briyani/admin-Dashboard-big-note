import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Star,
  StarHalf,
  ExternalLink,
  AlertTriangle,
  Loader
} from 'lucide-react';
import api from '../../services/api';
import axios from 'axios';

// Define the Book type with proper authorId handling
interface Book {
  id: string | number;
  _id?: string;
  title: string;
  authorId: {
    _id: string;
    name: string;
    email?: string;
  } | string;
  price: number;
  authorCopyPrice: number;
  stock: number;
  soldCopies: number;
  royalties: number;
  category: string;
  isbn: string;
  marketplaceLinks: {
    amazon: string;
    flipkart: string;
  };
  lastMonthSale: number;
  publication: {
    publicationId: string;
    publishedDate: string;
    description: string;
    rating: number;
  };
  status: string;
  coverImage?: string;
  printingTimeline?: any[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  totalRevenue?: number;
}

interface Author {
  _id: string;
  name: string;
  email?: string;
}

interface EditBookFormProps {
  book: Book;
  onSubmit: (book: Partial<Book>) => void;
  onCancel: () => void;
}

interface BookData {
  title: string;
  authorId: string;
  price: number;
  authorCopyPrice: number;
  stock: number;
  soldCopies: number;
  lastMonthSale: number;
  category: string;
  isbn: string;
  marketplaceLinks: {
    amazon: string;
    flipkart: string;
  };
  publication: {
    publicationId: string;
    description: string;
    publishedDate: string;
    rating: number;
  };
  status: string;
  coverImage?: string;
}

interface AddBookFormProps {
  onSubmit: (book: BookData) => void;
  onCancel: () => void;
}

const BooksContent = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/books');
        
        // Transform and validate the data
        const transformedData = response.data.map((book: any) => ({
          ...book,
          id: book._id || book.id, // Use _id as id if available
          // Ensure required properties exist to prevent errors
          title: book.title || 'Untitled Book',
          category: book.category || 'Uncategorized',
          // Set default values for other properties that might be used in rendering
          status: book.status || 'Unknown'
        }));
        
        setBooks(transformedData);
        setError(null);
      } catch (error) {
        console.error('Error fetching books:', error);
        setError('Failed to load books. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  // Filter books based on search and category
  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      (book.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (typeof book.authorId === 'object' && book.authorId?.name && 
       book.authorId.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || 
      (book.category?.toLowerCase() || '').includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Create pagination range
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
          onClick={() => handlePageChange(i)}
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddBook = async (newBookData: any) => {
    try {
      setLoading(true);
      
      // Log details for debugging
      console.log('API Base URL:', import.meta.env.VITE_API_URL);
      console.log('Endpoint being called:', '/books/create');
      console.log('Data being sent:', newBookData);
      
      // Add validation for required fields
      if (!newBookData.isbn || !newBookData.authorId) {
        setError('ISBN and Author are required fields.');
        setLoading(false);
        return;
      }
      
      // Simplify payload to only include necessary fields
      const payload = {
        title: newBookData.title,
        authorId: newBookData.authorId,
        price: newBookData.price,
        stock: newBookData.stock,
        category: newBookData.category,
        isbn: newBookData.isbn,
        coverImage: newBookData.coverImage,
        marketplaceLinks: newBookData.marketplaceLinks,
        publication: newBookData.publication,
      };
      
      // Use the correct endpoint matching what works in the direct test
      const response = await api.bookAPI.createBook(payload);
      console.log('Create book response:', response.data);
      
      // Handle success
      const newBook = {
        ...response.data,
        id: response.data._id || response.data.id
      };
      
      setBooks([newBook, ...books]);
      setIsAddModalOpen(false);
      setError(null);
      setSuccessMessage('Book created successfully!');
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error adding book:', error);
      
      // Enhanced error reporting
      let errorMessage = 'Failed to add book: Unknown error';
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        errorMessage = `Failed to add book: ${error.response.data?.message || error.response.statusText}`;
      } else if (error.request) {
        console.error('No response received:', error.request);
        errorMessage = 'Failed to add book: No response from server';
      } else {
        console.error('Error message:', error.message);
        errorMessage = `Failed to add book: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBook = async (updatedBook: Partial<Book>) => {
    if (!selectedBook) return;
    
    try {
      setLoading(true);
      const response = await api.put(`/admin/books/${selectedBook.id}`, updatedBook);
      
      // Update the book in the local state
      setBooks(books.map(book => 
        book.id === selectedBook.id ? { ...book, ...response.data.book } : book
      ));
      
      setIsEditModalOpen(false);
      setSelectedBook(null);
      setError(null);
      
      // Show success message
      setSuccessMessage('Book updated successfully!');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error updating book:', error);
      setError('Failed to update book. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBook = (book: Book) => {
    setSelectedBook(book);
    setIsEditModalOpen(true);
  };

  const handleDeleteBook = async (id: string | number) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        setLoading(true);
        await api.delete(`/admin/books/${id}`);
        setBooks(books.filter(book => book.id !== id));
        
        // Show success message
        setSuccessMessage('Book deleted successfully!');
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } catch (error) {
        console.error('Error deleting book:', error);
        setError('Failed to delete book. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Get status display for a book
  const getBookStatus = (status: string) => {
    switch(status) {
      case 'Published':
        return { label: 'Published', className: 'bg-green-100 text-green-800 border border-green-200' };
      case 'Draft':
        return { label: 'Draft', className: 'bg-blue-100 text-blue-800 border border-blue-200' };
      case 'Review':
        return { label: 'Under Review', className: 'bg-amber-100 text-amber-800 border border-amber-200' };
      case 'Inactive':
        return { label: 'Inactive', className: 'bg-gray-100 text-gray-800 border border-gray-200' };
      default:
        return { label: status, className: 'bg-purple-100 text-purple-800 border border-purple-200' };
    }
  };

  // Function to render rating stars
  const renderRatingStars = (rating: number) => {
    if (!rating) return null;
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} size={14} className="text-amber-500 fill-amber-500" />
        ))}
        {hasHalfStar && <StarHalf key="half" size={14} className="text-amber-500 fill-amber-500" />}
        <span className="ml-1 text-xs text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const renderListView = () => (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
      <table className="w-full">
        <thead>
          <tr className="text-left border-b bg-gray-50">
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {paginatedBooks.length > 0 ? (
            paginatedBooks.map((book) => {
              const status = getBookStatus(book.status);
              
              return (
                <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-8 bg-gray-200 rounded flex items-center justify-center overflow-hidden mr-3 border border-gray-300">
                        {book.coverImage ? (
                          <img 
                            src={book.coverImage} 
                            alt={book.title} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <BookOpen size={16} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{book.title}</div>
                        <div className="text-xs text-gray-500">
                          ISBN: {book.isbn}
                        </div>
                        {book.publication?.rating > 0 && (
                          <div className="mt-1">
                            {renderRatingStars(book.publication.rating)}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      {typeof book.authorId === 'object' ? book.authorId?.name : 'Unknown Author'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                      {book.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-700">₹{book.price?.toFixed(2)}</div>
                    {book.stock !== undefined && (
                      <div className="text-xs text-gray-500">
                        {book.stock} in stock
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`${status.className} text-xs font-medium px-3 py-1 rounded-full`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button 
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        title="Edit book"
                        onClick={() => handleEditBook(book)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete book"
                        onClick={() => handleDeleteBook(book.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center">
                <div className="text-gray-500 mb-2">
                  <svg className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">No books found matching your search criteria</p>
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
    </div>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {paginatedBooks.length > 0 ? (
        paginatedBooks.map((book) => {
          const status = getBookStatus(book.status);
          const authorName = typeof book.authorId === 'object' ? book.authorId?.name : 'Unknown Author';
          
          return (
            <div key={book.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md hover:-translate-y-1">
              <div className="h-48 bg-gray-200 flex items-center justify-center relative">
                {book.coverImage ? (
                  <img 
                    src={book.coverImage} 
                    alt={book.title} 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/150x200?text=No+Image';
                    }}
                  />
                ) : (
                  <BookOpen size={56} className="text-gray-400" />
                )}
                <div className="absolute top-2 right-2">
                  <span className={`${status.className} text-xs font-medium px-3 py-1 rounded-full shadow-sm`}>
                    {status.label}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">{book.title}</h3>
                <p className="text-sm text-gray-600">By {authorName}</p>
                
                {book.publication?.rating > 0 && (
                  <div className="mt-2">
                    {renderRatingStars(book.publication.rating)}
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs font-medium bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full border border-gray-200">
                    {book.category}
                  </span>
                  <span className="font-medium text-gray-900">${book.price?.toFixed(2)}</span>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      ISBN: {book.isbn}
                    </div>
                    <div className="flex space-x-1">
                      <button 
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        title="Edit book"
                        onClick={() => handleEditBook(book)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete book"
                        onClick={() => handleDeleteBook(book.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="col-span-full py-12 text-center">
          <div className="text-gray-500 mb-2">
            <BookOpen size={48} className="mx-auto text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">No books found matching your search criteria</p>
          {searchQuery && (
            <button 
              className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
              onClick={() => setSearchQuery('')}
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
        <div className="text-sm text-gray-600">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredBooks.length)} of {filteredBooks.length} books
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`w-8 h-8 flex items-center justify-center rounded-md ${
              currentPage === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 border border-gray-300 hover:bg-gray-100'
            }`}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex gap-1">
            {renderPaginationButtons()}
          </div>
          
          <button
            className={`w-8 h-8 flex items-center justify-center rounded-md ${
              currentPage === totalPages
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 border border-gray-300 hover:bg-gray-100'
            }`}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  const testDirectBookCreation = async () => {
    try {
      // Try different token key names
      const token = 
        localStorage.getItem('token') || 
        localStorage.getItem('accessToken') || 
        localStorage.getItem('authToken');
      
      console.log('Using token:', token ? 'Found token' : 'No token found');
      
      if (!token) {
        alert('No authentication token found in localStorage. Please log in again.');
        return;
      }
      
      // Basic book payload matching your backend schema
      const bookPayload = {
        title: "Test Book 12312",
        authorId: "67b00401356bc85bfbd1a7a4", 
        price: 29.99,
        stock: 100,
        category: "Fiction",
        isbn: "978-3-16-149411-0",
        coverImage: "https://via.placeholder.com/150x200?text=Test+Book",
        marketplaceLinks: {
          amazon: "https://amazon.com/book",
          flipkart: "https://flipkart.com/book"
        },
        publication: {
          publicationId: "PUB123",
          rating: 4.5,
          publishedDate: "2024-07-10",
          description: "A book created by an admin on behalf of an author"
        }
      };
      
      console.log('Sending direct test payload:', bookPayload);
      
      // Try a different endpoint
      const response = await axios.post('http://localhost:5000/api/books', 
        bookPayload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Direct test successful:', response.data);
      alert('Direct test successful!');
    } catch (error: any) {
      console.error('Direct test failed:', error);
      
      // Enhanced error reporting for direct test
      let errorMessage = 'Unknown error';
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        errorMessage = `Status ${error.response.status}: ${error.response.data?.message || error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'No response received from server';
      } else {
        errorMessage = error.message;
      }
      
      alert(`Direct test failed: ${errorMessage}`);
    }
  };

  return (
    <div className="px-6 py-6 max-w-full">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="text-indigo-600" size={28} />
            Book Management
          </h2>
          <p className="text-gray-500 mt-1">Manage books, stock, and publication details</p>
        </div>
        <button 
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={18} />
          Add New Book
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 flex items-start">
          <div className="flex-shrink-0 mr-3">
            <svg className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>{successMessage}</div>
        </div>
      )}

      {/* Search and filter bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search books or authors..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={18} className="text-gray-400" />
              </div>
              <select 
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1); // Reset to first page when filtering
                }}
              >
                <option value="all">All Categories</option>
                <option value="fiction">Fiction</option>
                <option value="non-fiction">Non-Fiction</option>
                <option value="mystery">Mystery</option>
                <option value="sci-fi">Science Fiction</option>
                <option value="fantasy">Fantasy</option>
              </select>
            </div>
            
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:text-gray-800'}`}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <List size={20} />
              </button>
              <button
                className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:text-gray-800'}`}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <Grid size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-start">
          <div className="flex-shrink-0 mr-3">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <p>{error}</p>
            <button 
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader size={24} className="animate-spin text-indigo-600 mr-3" />
          <span className="text-gray-600 font-medium">Loading books...</span>
        </div>
      ) : (
        <>
          {viewMode === 'list' ? renderListView() : renderGridView()}
          {renderPagination()}
        </>
      )}

      {/* Add Book Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Plus size={20} className="text-indigo-600" />
                  Add New Book
                </h3>
                <button 
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  &times;
                </button>
              </div>
              
              <AddBookForm 
                onSubmit={handleAddBook} 
                onCancel={() => setIsAddModalOpen(false)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {isEditModalOpen && selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Edit2 size={20} className="text-indigo-600" />
                  Edit Book
                </h3>
                <button 
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  &times;
                </button>
              </div>
              
              <EditBookForm 
                book={selectedBook} 
                onSubmit={handleUpdateBook} 
                onCancel={() => setIsEditModalOpen(false)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Test Button - hidden in production */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button 
            type="button" 
            onClick={testDirectBookCreation} 
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2"
          >
            <ExternalLink size={16} />
            Test Direct API Call
          </button>
        </div>
      )}
    </div>
  );
};

const EditBookForm = ({ book, onSubmit, onCancel }: EditBookFormProps) => {
  const [formData, setFormData] = useState({
    title: book.title || '',
    price: book.price || 0,
    authorCopyPrice: book.authorCopyPrice || 0,
    stock: book.stock || 0,
    soldCopies: book.soldCopies || 0,
    lastMonthSale: book.lastMonthSale || 0,
    category: book.category || '',
    isbn: book.isbn || '',
    marketplaceLinks: {
      amazon: book.marketplaceLinks?.amazon || '',
      flipkart: book.marketplaceLinks?.flipkart || ''
    },
    publication: {
      publicationId: book.publication?.publicationId || '',
      description: book.publication?.description || '',
      publishedDate: book.publication?.publishedDate ? new Date(book.publication.publishedDate).toISOString().split('T')[0] : '',
      rating: book.publication?.rating || 0
    },
    status: book.status || 'Active'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...((prev[parent as keyof typeof prev] as Record<string, any>) || {}),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Field styling classes for consistency
  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all";
  const labelClass = "block text-gray-700 text-sm font-medium mb-2";
  const sectionTitleClass = "text-md font-semibold text-gray-800 mb-3";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="title">
            Title*
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>
        
        <div>
          <label className={labelClass} htmlFor="isbn">
            ISBN*
          </label>
          <input
            type="text"
            id="isbn"
            name="isbn"
            value={formData.isbn}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelClass} htmlFor="price">
            Price*
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500">₹</span>
            </div>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="pl-7 pr-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
        </div>
        
        <div>
          <label className={labelClass} htmlFor="authorCopyPrice">
            Author Copy Price
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500">₹</span>
            </div>
            <input
              type="number"
              id="authorCopyPrice"
              name="authorCopyPrice"
              value={formData.authorCopyPrice}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="pl-7 pr-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div>
          <label className={labelClass} htmlFor="status">
            Status*
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={inputClass}
            required
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Review">Review</option>
          </select>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-5">
        <h4 className={sectionTitleClass}>Inventory Management</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass} htmlFor="stock">
              Current Stock*
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              min="0"
              className={inputClass}
              required
            />
          </div>
          
          <div>
            <label className={labelClass} htmlFor="soldCopies">
              Sold Copies
            </label>
            <input
              type="number"
              id="soldCopies"
              name="soldCopies"
              value={formData.soldCopies}
              onChange={handleChange}
              min="0"
              className={inputClass}
            />
          </div>
          
          <div>
            <label className={labelClass} htmlFor="lastMonthSale">
              Last Month Sales
            </label>
            <input
              type="number"
              id="lastMonthSale"
              name="lastMonthSale"
              value={formData.lastMonthSale}
              onChange={handleChange}
              min="0"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="category">
            Category*
          </label>
          <input
            type="text"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-5">
        <h4 className={sectionTitleClass}>Marketplace Links</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="marketplaceLinks.amazon">
              Amazon URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ExternalLink size={16} className="text-gray-400" />
              </div>
              <input
                type="url"
                id="marketplaceLinks.amazon"
                name="marketplaceLinks.amazon"
                value={formData.marketplaceLinks.amazon}
                onChange={handleChange}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className={labelClass} htmlFor="marketplaceLinks.flipkart">
              Flipkart URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ExternalLink size={16} className="text-gray-400" />
              </div>
              <input
                type="url"
                id="marketplaceLinks.flipkart"
                name="marketplaceLinks.flipkart"
                value={formData.marketplaceLinks.flipkart}
                onChange={handleChange}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-5">
        <h4 className={sectionTitleClass}>Publication Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="publication.publicationId">
              Publication ID*
            </label>
            <input
              type="text"
              id="publication.publicationId"
              name="publication.publicationId"
              value={formData.publication.publicationId}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>
          
          <div>
            <label className={labelClass} htmlFor="publication.publishedDate">
              Published Date*
            </label>
            <input
              type="date"
              id="publication.publishedDate"
              name="publication.publishedDate"
              value={formData.publication.publishedDate}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>

          {/* Add Rating field */}
          <div>
            <label className={labelClass} htmlFor="publication.rating">
              Rating (0-5)
            </label>
            <input
              type="number"
              id="publication.rating"
              name="publication.rating"
              value={formData.publication.rating}
              onChange={handleChange}
              min="0"
              max="5"
              step="0.1"
              className={inputClass}
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className={labelClass} htmlFor="publication.description">
            Description*
          </label>
          <textarea
            id="publication.description"
            name="publication.description"
            value={formData.publication.description}
            onChange={handleChange}
            rows={3}
            className={inputClass}
            required
          ></textarea>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
};

const AddBookForm = ({ onSubmit, onCancel }: AddBookFormProps) => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    authorId: '',
    price: 0,
    authorCopyPrice: 0,
    stock: 0,
    soldCopies: 0,
    lastMonthSale: 0,
    category: '',
    isbn: '',
    coverImage: '',
    marketplaceLinks: {
      amazon: '',
      flipkart: ''
    },
    publication: {
      publicationId: '',
      description: '',
      publishedDate: new Date().toISOString().split('T')[0],
      rating: 0
    },
    status: 'Active'
  });

  // Fetch all authors when component mounts
  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        setLoading(true);
        const response = await api.userAPI.getAllUsers();
        // Filter for only author role users if needed
        const authorUsers = response.data.filter((user: any) => user.role === 'author');
        setAuthors(authorUsers);
      } catch (error) {
        console.error('Error fetching authors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthors();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...((prev[parent as keyof typeof prev] as Record<string, unknown>) || {}),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Field styling classes for consistency
  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all";
  const labelClass = "block text-gray-700 text-sm font-medium mb-2";
  const sectionTitleClass = "text-md font-semibold text-gray-800 mb-3";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass} htmlFor="title">
            Book Title*
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>
        
        {/* Add author selection dropdown */}
        <div>
          <label className={labelClass} htmlFor="authorId">
            Author*
          </label>
          <select
            id="authorId"
            name="authorId"
            value={formData.authorId}
            onChange={handleChange}
            className={inputClass}
            required
          >
            <option value="">Select an author</option>
            {authors.map(author => (
              <option key={author._id} value={author._id}>
                {author.name} {author.email ? `(${author.email})` : ''}
              </option>
            ))}
          </select>
          {loading && (
            <div className="mt-1 text-sm text-gray-500 flex items-center">
              <Loader size={14} className="animate-spin mr-2" />
              Loading authors...
            </div>
          )}
        </div>
        
        {/* Add ISBN field */}
        <div>
          <label className={labelClass} htmlFor="isbn">
            ISBN*
          </label>
          <input
            type="text"
            id="isbn"
            name="isbn"
            value={formData.isbn}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>
        
        <div>
          <label className={labelClass} htmlFor="price">
            Price*
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500">$</span>
            </div>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="pl-7 pr-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelClass} htmlFor="authorCopyPrice">
            Author Copy Price
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500">$</span>
            </div>
            <input
              type="number"
              id="authorCopyPrice"
              name="authorCopyPrice"
              value={formData.authorCopyPrice}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="pl-7 pr-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div>
          <label className={labelClass} htmlFor="status">
            Status*
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={inputClass}
            required
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Review">Review</option>
          </select>
        </div>
        
        <div>
          <label className={labelClass} htmlFor="category">
            Category*
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={inputClass}
            required
          >
            <option value="">Select a category</option>
            <option value="Fiction">Fiction</option>
            <option value="Non-Fiction">Non-Fiction</option>
            <option value="Mystery">Mystery</option>
            <option value="Sci-Fi">Science Fiction</option>
            <option value="Fantasy">Fantasy</option>
            <option value="Biography">Biography</option>
            <option value="Self-Help">Self-Help</option>
            <option value="Business">Business</option>
          </select>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-5">
        <h4 className={sectionTitleClass}>Inventory Management</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass} htmlFor="stock">
              Current Stock*
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              min="0"
              className={inputClass}
              required
            />
          </div>
          
          <div>
            <label className={labelClass} htmlFor="soldCopies">
              Sold Copies
            </label>
            <input
              type="number"
              id="soldCopies"
              name="soldCopies"
              value={formData.soldCopies}
              onChange={handleChange}
              min="0"
              className={inputClass}
            />
          </div>
          
          <div>
            <label className={labelClass} htmlFor="lastMonthSale">
              Last Month Sales
            </label>
            <input
              type="number"
              id="lastMonthSale"
              name="lastMonthSale"
              value={formData.lastMonthSale}
              onChange={handleChange}
              min="0"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-5">
        <h4 className={sectionTitleClass}>Marketplace Links</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="marketplaceLinks.amazon">
              Amazon URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ExternalLink size={16} className="text-gray-400" />
              </div>
              <input
                type="url"
                id="marketplaceLinks.amazon"
                name="marketplaceLinks.amazon"
                value={formData.marketplaceLinks.amazon}
                onChange={handleChange}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="https://amazon.com/your-book"
              />
            </div>
          </div>
          
          <div>
            <label className={labelClass} htmlFor="marketplaceLinks.flipkart">
              Flipkart URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ExternalLink size={16} className="text-gray-400" />
              </div>
              <input
                type="url"
                id="marketplaceLinks.flipkart"
                name="marketplaceLinks.flipkart"
                value={formData.marketplaceLinks.flipkart}
                onChange={handleChange}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="https://flipkart.com/your-book"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-5">
        <h4 className={sectionTitleClass}>Publication Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="publication.publicationId">
              Publication ID*
            </label>
            <input
              type="text"
              id="publication.publicationId"
              name="publication.publicationId"
              value={formData.publication.publicationId}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>
          
          <div>
            <label className={labelClass} htmlFor="publication.publishedDate">
              Published Date*
            </label>
            <input
              type="date"
              id="publication.publishedDate"
              name="publication.publishedDate"
              value={formData.publication.publishedDate}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>

          {/* Add Rating field */}
          <div>
            <label className={labelClass} htmlFor="publication.rating">
              Rating (0-5)
            </label>
            <input
              type="number"
              id="publication.rating"
              name="publication.rating"
              value={formData.publication.rating}
              onChange={handleChange}
              min="0"
              max="5"
              step="0.1"
              className={inputClass}
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className={labelClass} htmlFor="publication.description">
            Description*
          </label>
          <textarea
            id="publication.description"
            name="publication.description"
            value={formData.publication.description}
            onChange={handleChange}
            rows={3}
            className={inputClass}
            required
          ></textarea>
        </div>
      </div>
      
      <div>
        <label className={labelClass} htmlFor="coverImage">
          Cover Image URL
        </label>
        <input
          type="url"
          id="coverImage"
          name="coverImage"
          value={formData.coverImage}
          onChange={handleChange}
          placeholder="https://example.com/book-cover.jpg"
          className={inputClass}
        />
        {formData.coverImage && (
          <div className="mt-2 flex items-center">
            <div className="h-16 w-12 border rounded-md overflow-hidden mr-2">
              <img 
                src={formData.coverImage} 
                alt="Cover preview" 
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/150x200?text=Invalid+URL';
                }}
              />
            </div>
            <span className="text-xs text-gray-500">Preview (update URL if image doesn't appear)</span>
          </div>
        )}
      </div>
      
      {/* Submit buttons */}
      <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Add Book
        </button>
      </div>
    </form>
  );
};

export default BooksContent;