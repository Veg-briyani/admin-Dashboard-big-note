// File: components/BookManagement/index.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Loader,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  FileText,
  Package,
  BarChart2
} from 'lucide-react';
import api from '../../services/api';

// Types
interface Author {
  _id: string;
  name: string;
  email?: string;
}

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

// Type for form values
type BookFormValues = {
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
};

// ---- Custom hooks ----

// Hook for book data fetching and mutations
const useBooks = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<any>(null);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [isUpdatingBook, setIsUpdatingBook] = useState(false);
  const [isDeletingBook, setIsDeletingBook] = useState(false);

  // Fetch books and authors
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    
    try {
      // Fetch books
      const booksResponse = await api.get('/admin/books');
      const transformedBooks = booksResponse.data.map((book: any) => ({
        ...book,
        id: book._id || book.id,
        title: book.title || 'Untitled Book',
        category: book.category || 'Uncategorized',
        status: book.status || 'Unknown'
      }));
      
      // Fetch authors
      const authorsResponse = await api.userAPI.getAllUsers();
      const filteredAuthors = authorsResponse.data.filter((user: any) => user.role === 'author');
      
      setBooks(transformedBooks);
      setAuthors(filteredAuthors);
    } catch (err) {
      console.error('Error fetching data:', err);
      setIsError(true);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add book
  const addBook = useCallback(async (newBook: BookFormValues) => {
    setIsAddingBook(true);
    
    try {
      const response = await api.bookAPI.createBook(newBook);
      setBooks(prevBooks => [
        {
          ...response.data,
          id: response.data._id || response.data.id
        },
        ...prevBooks
      ]);
      return response;
    } catch (err) {
      console.error('Error adding book:', err);
      throw err;
    } finally {
      setIsAddingBook(false);
    }
  }, []);

  // Update book
  const updateBook = useCallback(async ({ id, data }: { id: string | number, data: Partial<Book> }) => {
    setIsUpdatingBook(true);
    
    try {
      const response = await api.put(`/admin/books/${id}`, data);
      setBooks(prevBooks => 
        prevBooks.map(book => 
          book.id === id ? { ...book, ...response.data.book } : book
        )
      );
      return response;
    } catch (err) {
      console.error('Error updating book:', err);
      throw err;
    } finally {
      setIsUpdatingBook(false);
    }
  }, []);

  // Delete book
  const deleteBook = useCallback(async (id: string | number) => {
    setIsDeletingBook(true);
    
    try {
      const response = await api.delete(`/admin/books/${id}`);
      setBooks(prevBooks => prevBooks.filter(book => book.id !== id));
      return response;
    } catch (err) {
      console.error('Error deleting book:', err);
      throw err;
    } finally {
      setIsDeletingBook(false);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    books,
    authors,
    isLoading,
    isError,
    error,
    refetch: fetchData,
    addBook,
    updateBook,
    deleteBook,
    isAddingBook,
    isUpdatingBook,
    isDeletingBook
  };
};

// ---- UI Components ----

// Tooltip component
const Tooltip = ({ children, content }: { children: React.ReactNode, content: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div className="relative" 
      onMouseEnter={() => setIsVisible(true)} 
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div 
          className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded-md whitespace-nowrap"
          style={{ 
            animation: 'fadeIn 0.2s ease-in-out',
            transition: 'opacity 0.2s, transform 0.2s',
          }}
        >
          {content}
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 border-t-4 border-l-4 border-r-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
};

// Button component
const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  ...props 
}: {
  children: React.ReactNode, 
  onClick?: () => void, 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost',
  size?: 'sm' | 'md' | 'lg',
  isLoading?: boolean,
  icon?: React.ReactNode,
  className?: string,
  [key: string]: any
}) => {
  // Variant styles
  const variantStyles = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm',
    secondary: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700'
  };
  
  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-5 py-2.5 text-lg'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${variantStyles[variant]} ${sizeStyles[size]} ${isLoading ? 'opacity-80 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} className="animate-spin mr-2" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

// Badge component
const Badge = ({ 
  children, 
  variant = 'default' 
}: { 
  children: React.ReactNode, 
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' 
}) => {
  const variantStyles = {
    default: 'bg-gray-100 text-gray-800 border border-gray-200',
    success: 'bg-green-100 text-green-800 border border-green-200',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200',
    danger: 'bg-red-100 text-red-800 border border-red-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200'
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]}`}>
      {children}
    </span>
  );
};

// Alert component
const Alert = ({ 
  title, 
  message, 
  variant = 'info',
  onDismiss
}: { 
  title?: string, 
  message: string, 
  variant?: 'success' | 'warning' | 'error' | 'info',
  onDismiss?: () => void
}) => {
  const variantStyles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: <Check className="h-5 w-5 text-green-600" />
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: <AlertTriangle className="h-5 w-5 text-amber-600" />
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <AlertCircle className="h-5 w-5 text-red-600" />
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: <AlertCircle className="h-5 w-5 text-blue-600" />
    }
  };
  
  const styles = variantStyles[variant];
  
  return (
    <div 
      className={`${styles.bg} ${styles.border} ${styles.text} px-4 py-3 rounded-lg flex items-start mb-6`}
      style={{ 
        animation: 'fadeInDown 0.3s ease-out',
      }}
    >
      <div className="flex-shrink-0 mr-3">
        {styles.icon}
      </div>
      <div className="flex-1">
        {title && <h3 className="font-medium mb-1">{title}</h3>}
        <p className="text-sm">{message}</p>
        {variant === 'error' && (
          <button 
            className="mt-2 text-sm font-medium hover:underline"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        )}
      </div>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-white/20"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

// Modal component
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md' 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  title: string, 
  children: React.ReactNode,
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) => {
  const sizeStyles = {
    sm: 'max-w-lg',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  // Close when Escape key is pressed
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent scrolling on body when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby={title} role="dialog" aria-modal="true">
      <div className="min-h-screen px-4 flex items-center justify-center">
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
          onClick={onClose}
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        />
        
        <div 
          className={`relative bg-white rounded-xl shadow-xl w-full ${sizeStyles[size]} max-h-[90vh] overflow-y-auto my-8`}
          style={{ animation: 'zoomIn 0.3s ease-out' }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
          <div className="px-6 py-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Confirmation dialog component
const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger'
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void, 
  title: string, 
  message: string,
  confirmLabel?: string,
  cancelLabel?: string,
  variant?: 'danger' | 'warning' | 'info'
}) => {
  const variantStyles = {
    danger: {
      button: 'bg-red-600 hover:bg-red-700 text-white',
      icon: <AlertCircle className="h-6 w-6 text-red-600" />
    },
    warning: {
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
      icon: <AlertTriangle className="h-6 w-6 text-amber-600" />
    },
    info: {
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      icon: <AlertCircle className="h-6 w-6 text-blue-600" />
    }
  };

  const styles = variantStyles[variant];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby={title} role="dialog" aria-modal="true">
      <div className="min-h-screen px-4 flex items-center justify-center">
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
          onClick={onClose}
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        />
        
        <div 
          className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto my-8"
          style={{ animation: 'zoomIn 0.3s ease-out' }}
        >
          <div className="p-6">
            <div className="flex gap-4 items-start mb-4">
              <div className="flex-shrink-0">
                {styles.icon}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                <p className="mt-2 text-sm text-gray-500">{message}</p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {cancelLabel}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-4 py-2 rounded-lg font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${styles.button}`}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton loader component for book items
const BookItemSkeleton = ({ isGridView }: { isGridView: boolean }) => {
  if (isGridView) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
        <div className="h-48 bg-gray-200" />
        <div className="p-4">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
          <div className="flex justify-between items-center mt-3">
            <div className="h-6 bg-gray-200 rounded-full w-1/3" />
            <div className="h-6 bg-gray-200 rounded w-1/4" />
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="flex space-x-1">
                <div className="h-8 w-8 bg-gray-200 rounded-full" />
                <div className="h-8 w-8 bg-gray-200 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className="h-10 w-8 bg-gray-200 rounded mr-3" />
          <div>
            <div className="h-5 bg-gray-200 rounded w-40 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-5 bg-gray-200 rounded w-32" />
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200 rounded-full w-20" />
      </td>
      <td className="px-6 py-4">
        <div className="h-5 bg-gray-200 rounded w-16 mb-1" />
        <div className="h-4 bg-gray-200 rounded w-24" />
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200 rounded-full w-24" />
      </td>
      <td className="px-6 py-4">
        <div className="flex space-x-2">
          <div className="h-8 w-8 bg-gray-200 rounded-full" />
          <div className="h-8 w-8 bg-gray-200 rounded-full" />
        </div>
      </td>
    </tr>
  );
};

// Empty state component
const EmptyState = ({ 
  title, 
  description, 
  icon, 
  action 
}: { 
  title: string, 
  description: string, 
  icon?: React.ReactNode, 
  action?: React.ReactNode 
}) => {
  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-500 mb-4">
        {icon || <BookOpen size={32} />}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">{description}</p>
      {action}
    </div>
  );
};

// BookList component
const BookList = ({ 
  books, 
  isLoading, 
  onEdit, 
  onDelete,
  searchQuery,
  setSearchQuery
}: { 
  books: Book[], 
  isLoading: boolean, 
  onEdit: (book: Book) => void, 
  onDelete: (id: string | number) => void,
  searchQuery: string,
  setSearchQuery: (query: string) => void
}) => {
  // Function to get status display
  const getBookStatus = (status: string) => {
    switch(status) {
      case 'Published':
        return { label: 'Published', variant: 'success' as const };
      case 'Draft':
        return { label: 'Draft', variant: 'info' as const };
      case 'Review':
        return { label: 'Under Review', variant: 'warning' as const };
      case 'Inactive':
        return { label: 'Inactive', variant: 'default' as const };
      default:
        return { label: status, variant: 'default' as const };
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

  if (isLoading) {
    return (
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
            {[...Array(4)].map((_, index) => (
              <BookItemSkeleton key={index} isGridView={false} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <EmptyState
        title="No books found"
        description={searchQuery ? "No books match your search criteria. Try adjusting your filters or search term." : "There are no books in the system yet. Add your first book to get started."}
        icon={<BookOpen size={32} />}
        action={searchQuery ? (
          <Button 
            variant="secondary" 
            onClick={() => setSearchQuery('')}
            icon={<RefreshCw size={16} />}
          >
            Clear search
          </Button>
        ) : undefined}
      />
    );
  }

  return (
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
          {books.map((book) => {
            const status = getBookStatus(book.status);
            const authorName = typeof book.authorId === 'object' ? book.authorId?.name : 'Unknown Author';
            
            return (
              <tr key={book.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-8 bg-gray-200 rounded flex items-center justify-center overflow-hidden mr-3 border border-gray-300 group-hover:border-indigo-300 transition-colors">
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
                    {authorName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge>{book.category}</Badge>
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
                  <Badge variant={status.variant}>{status.label}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <Tooltip content="Edit book">
                      <button 
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        onClick={() => onEdit(book)}
                        aria-label={`Edit ${book.title}`}
                      >
                        <Edit2 size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Delete book">
                      <button 
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        onClick={() => onDelete(book.id)}
                        aria-label={`Delete ${book.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// BookGrid component
const BookGrid = ({ 
  books, 
  isLoading, 
  onEdit, 
  onDelete,
  searchQuery,
  setSearchQuery
}: { 
  books: Book[], 
  isLoading: boolean, 
  onEdit: (book: Book) => void, 
  onDelete: (id: string | number) => void,
  searchQuery: string,
  setSearchQuery: (query: string) => void
}) => {
  // Function to get status display
  const getBookStatus = (status: string) => {
    switch(status) {
      case 'Published':
        return { label: 'Published', variant: 'success' as const };
      case 'Draft':
        return { label: 'Draft', variant: 'info' as const };
      case 'Review':
        return { label: 'Under Review', variant: 'warning' as const };
      case 'Inactive':
        return { label: 'Inactive', variant: 'default' as const };
      default:
        return { label: status, variant: 'default' as const };
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <BookItemSkeleton key={index} isGridView={true} />
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <EmptyState
        title="No books found"
        description={searchQuery ? "No books match your search criteria. Try adjusting your filters or search term." : "There are no books in the system yet. Add your first book to get started."}
        icon={<BookOpen size={32} />}
        action={searchQuery ? (
          <Button 
            variant="secondary" 
            onClick={() => setSearchQuery('')}
            icon={<RefreshCw size={16} />}
          >
            Clear search
          </Button>
        ) : undefined}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {books.map((book) => {
        const status = getBookStatus(book.status);
        const authorName = typeof book.authorId === 'object' ? book.authorId?.name : 'Unknown Author';
        
        return (
          <div 
            key={book.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all transform hover:-translate-y-1"
          >
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
                <Badge variant={status.variant}>{status.label}</Badge>
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
                <Badge>{book.category}</Badge>
                <span className="font-medium text-gray-900">₹{book.price?.toFixed(2)}</span>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    ISBN: {book.isbn}
                  </div>
                  <div className="flex space-x-1">
                    <Tooltip content="Edit book">
                      <button 
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        onClick={() => onEdit(book)}
                        aria-label={`Edit ${book.title}`}
                      >
                        <Edit2 size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Delete book">
                      <button 
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        onClick={() => onDelete(book.id)}
                        aria-label={`Delete ${book.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// BookFilters component
const BookFilters = ({ 
  searchQuery, 
  setSearchQuery, 
  selectedCategory, 
  setSelectedCategory, 
  viewMode, 
  setViewMode,
  categories
}: { 
  searchQuery: string, 
  setSearchQuery: (query: string) => void, 
  selectedCategory: string, 
  setSelectedCategory: (category: string) => void, 
  viewMode: 'grid' | 'list', 
  setViewMode: (mode: 'grid' | 'list') => void,
  categories: string[]
}) => {
  return (
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
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search books"
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
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category.toLowerCase()}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Tooltip content="List view">
              <button
                className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:text-gray-800'}`}
                onClick={() => setViewMode('list')}
                aria-label="Switch to list view"
                aria-pressed={viewMode === 'list'}
              >
                <List size={20} />
              </button>
            </Tooltip>
            <Tooltip content="Grid view">
              <button
                className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:text-gray-800'}`}
                onClick={() => setViewMode('grid')}
                aria-label="Switch to grid view"
                aria-pressed={viewMode === 'grid'}
              >
                <Grid size={20} />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

// Pagination component
const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems, 
  itemsPerPage 
}: { 
  currentPage: number, 
  totalPages: number, 
  onPageChange: (page: number) => void, 
  totalItems: number, 
  itemsPerPage: number 
}) => {
  if (totalPages <= 1) return null;
  
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
          onClick={() => onPageChange(i)}
          aria-label={`Page ${i}`}
          aria-current={currentPage === i ? 'page' : undefined}
          className={`w-8 h-8 rounded-md flex items-center justify-center ${
            currentPage === i
              ? 'bg-indigo-600 text-white font-medium shadow-sm'
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
    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
      <div className="text-sm text-gray-600">
        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} books
      </div>
      <div className="flex items-center gap-2">
        <button
          className={`w-8 h-8 flex items-center justify-center rounded-md ${
            currentPage === 1
              ? 'text-gray-400 cursor-not-allowed border border-gray-200'
              : 'text-gray-700 border border-gray-300 hover:bg-gray-100'
          }`}
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        
        <div className="hidden sm:flex gap-1">
          {renderPaginationButtons()}
        </div>
        
        <span className="sm:hidden text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        
        <button
          className={`w-8 h-8 flex items-center justify-center rounded-md ${
            currentPage === totalPages
              ? 'text-gray-400 cursor-not-allowed border border-gray-200'
              : 'text-gray-700 border border-gray-300 hover:bg-gray-100'
          }`}
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

// BookForm component
const BookForm = ({ 
  book, 
  authors, 
  onSubmit, 
  onCancel, 
  isSubmitting 
}: { 
  book?: Book, 
  authors: Author[], 
  onSubmit: (data: BookFormValues) => void, 
  onCancel: () => void, 
  isSubmitting: boolean 
}) => {
  const isEditing = !!book;
  
  // Form state using standard React state
  const [formData, setFormData] = useState<BookFormValues>({
    title: book?.title || '',
    authorId: typeof book?.authorId === 'object' ? book.authorId._id : book?.authorId?.toString() || '',
    price: book?.price || 0,
    authorCopyPrice: book?.authorCopyPrice || 0,
    stock: book?.stock || 0,
    soldCopies: book?.soldCopies || 0,
    lastMonthSale: book?.lastMonthSale || 0,
    category: book?.category || '',
    isbn: book?.isbn || '',
    marketplaceLinks: {
      amazon: book?.marketplaceLinks?.amazon || '',
      flipkart: book?.marketplaceLinks?.flipkart || ''
    },
    publication: {
      publicationId: book?.publication?.publicationId || '',
      description: book?.publication?.description || '',
      publishedDate: book?.publication?.publishedDate 
        ? new Date(book.publication.publishedDate).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
      rating: book?.publication?.rating || 0
    },
    status: book?.status || 'Active',
    coverImage: book?.coverImage || ''
  });

  // Form validation state
  const [errors, setErrors] = useState<Record<string, { message: string }>>({});
  const [previewImage, setPreviewImage] = useState<string>(book?.coverImage || '');

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle nested fields (e.g., marketplaceLinks.amazon)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: type === 'number' ? parseFloat(value) : value
        }
      }));
    } else {
      // Handle regular fields
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value
      }));
    }
    
    // Clear error for this field when it's changed
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, { message: string }> = {};
    
    // Required fields
    if (!formData.title) newErrors.title = { message: 'Title is required' };
    if (!formData.authorId) newErrors.authorId = { message: 'Author is required' };
    if (!formData.isbn) newErrors.isbn = { message: 'ISBN is required' };
    if (!formData.category) newErrors.category = { message: 'Category is required' };
    if (!formData.status) newErrors.status = { message: 'Status is required' };
    
    // Price validations
    if (formData.price < 0) newErrors.price = { message: 'Price must be a positive number' };
    if (formData.authorCopyPrice < 0) newErrors.authorCopyPrice = { message: 'Author copy price must be a positive number' };
    
    // Inventory validations
    if (formData.stock < 0) newErrors.stock = { message: 'Stock must be a non-negative number' };
    
    // Publication validations
    if (!formData.publication.publicationId) newErrors['publication.publicationId'] = { message: 'Publication ID is required' };
    if (!formData.publication.description) newErrors['publication.description'] = { message: 'Description is required' };
    if (!formData.publication.publishedDate) newErrors['publication.publishedDate'] = { message: 'Published date is required' };
    if (formData.publication.rating < 0 || formData.publication.rating > 5) {
      newErrors['publication.rating'] = { message: 'Rating must be between 0 and 5' };
    }
    
    // URL validations
    if (formData.marketplaceLinks.amazon && !/^https?:\/\/.*/.test(formData.marketplaceLinks.amazon)) {
      newErrors['marketplaceLinks.amazon'] = { message: 'Please enter a valid URL' };
    }
    if (formData.marketplaceLinks.flipkart && !/^https?:\/\/.*/.test(formData.marketplaceLinks.flipkart)) {
      newErrors['marketplaceLinks.flipkart'] = { message: 'Please enter a valid URL' };
    }
    if (formData.coverImage && !/^https?:\/\/.*/.test(formData.coverImage)) {
      newErrors.coverImage = { message: 'Please enter a valid URL' };
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // Update preview image when coverImage changes
  useEffect(() => {
    setPreviewImage(formData.coverImage || '');
  }, [formData.coverImage]);

  // Categories
  const categories = [
    'Fiction',
    'Non-Fiction',
    'Mystery',
    'Sci-Fi',
    'Fantasy',
    'Biography',
    'Self-Help',
    'Business'
  ];

  // Statuses
  const statuses = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Published', label: 'Published' },
    { value: 'Draft', label: 'Draft' },
    { value: 'Review', label: 'Under Review' }
  ];

  // Input field component for the form
  const InputField = ({ 
    label, 
    name, 
    type = 'text',
    required = false,
    prefix,
    disabled = false,
    placeholder = '',
    className = '',
    helperText,
    ...props 
  }: { 
    label: string, 
    name: string, 
    type?: string,
    required?: boolean,
    prefix?: React.ReactNode,
    disabled?: boolean,
    placeholder?: string,
    className?: string,
    helperText?: string,
    [key: string]: any 
  }) => {
    const value = name.includes('.') 
      ? name.split('.').reduce((obj, key) => obj?.[key], formData as any) 
      : formData[name as keyof typeof formData];
    
    return (
      <div className={`${className}`}>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className={`relative ${prefix ? 'flex items-center' : ''}`}>
          {prefix && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              {prefix}
            </div>
          )}
          <input
            id={name}
            name={name}
            type={type}
            disabled={disabled}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            className={`w-full border ${errors[name] ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${prefix ? 'pl-10' : 'px-3'} py-2 disabled:bg-gray-100 disabled:text-gray-500`}
            {...props}
          />
        </div>
        {helperText && !errors[name] && (
          <p className="mt-1 text-xs text-gray-500">{helperText}</p>
        )}
        {errors[name] && (
          <p className="mt-1 text-xs text-red-600">{errors[name].message}</p>
        )}
      </div>
    );
  };

  // Textarea field component for the form
  const TextareaField = ({ 
    label, 
    name, 
    required = false,
    rows = 3,
    placeholder = '',
    className = '',
    ...props 
  }: { 
    label: string, 
    name: string, 
    required?: boolean,
    rows?: number,
    placeholder?: string,
    className?: string,
    [key: string]: any 
  }) => {
    const value = name.includes('.') 
      ? name.split('.').reduce((obj, key) => obj?.[key], formData as any) 
      : formData[name as keyof typeof formData];
    
    return (
      <div className={`${className}`}>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
          id={name}
          name={name}
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          className={`w-full border ${errors[name] ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2`}
          {...props}
        />
        {errors[name] && (
          <p className="mt-1 text-xs text-red-600">{errors[name].message}</p>
        )}
      </div>
    );
  };

  // Select field component for the form
  const SelectField = ({ 
    label, 
    name, 
    options, 
    required = false,
    className = '',
    ...props 
  }: { 
    label: string, 
    name: string, 
    options: { value: string, label: string }[],
    required?: boolean,
    className?: string,
    [key: string]: any 
  }) => {
    const value = name.includes('.') 
      ? name.split('.').reduce((obj, key) => obj?.[key], formData as any) 
      : formData[name as keyof typeof formData];
    
    return (
      <div className={`${className}`}>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          className={`w-full border ${errors[name] ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 bg-white`}
          {...props}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors[name] && (
          <p className="mt-1 text-xs text-red-600">{errors[name].message}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Book Details Section */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
        <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
          <FileText size={18} className="text-indigo-600 mr-2" />
          Book Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <InputField
            label="Title"
            name="title"
            required
            placeholder="Enter book title"
          />
          
          <SelectField
            label="Author"
            name="authorId"
            required
            options={authors.map(author => ({
              value: author._id,
              label: `${author.name}${author.email ? ` (${author.email})` : ''}`
            }))}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <InputField
            label="ISBN"
            name="isbn"
            required
            placeholder="e.g., 978-3-16-148410-0"
          />
          
          <SelectField
            label="Category"
            name="category"
            required
            options={categories.map(category => ({
              value: category,
              label: category
            }))}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Price"
            name="price"
            required
            type="number"
            step="0.01"
            min="0"
            prefix="₹"
          />
          
          <InputField
            label="Author Copy Price"
            name="authorCopyPrice"
            type="number"
            step="0.01"
            min="0"
            prefix="₹"
          />
          
          <SelectField
            label="Status"
            name="status"
            required
            options={statuses}
          />
        </div>
      </div>
      
      {/* Inventory Section */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
        <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
          <Package size={18} className="text-indigo-600 mr-2" />
          Inventory Management
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Current Stock"
            name="stock"
            required
            type="number"
            min="0"
          />
          
          <InputField
            label="Sold Copies"
            name="soldCopies"
            type="number"
            min="0"
            disabled={!isEditing}
            helperText={!isEditing ? "Available after creation" : ""}
          />
          
          <InputField
            label="Last Month Sales"
            name="lastMonthSale"
            type="number"
            min="0"
            disabled={!isEditing}
            helperText={!isEditing ? "Available after creation" : ""}
          />
        </div>
      </div>
      
      {/* Marketplace Links */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
        <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
          <ExternalLink size={18} className="text-indigo-600 mr-2" />
          Marketplace Links
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Amazon URL"
            name="marketplaceLinks.amazon"
            type="url"
            placeholder="https://amazon.com/your-book"
            prefix={<ExternalLink size={16} />}
          />
          
          <InputField
            label="Flipkart URL"
            name="marketplaceLinks.flipkart"
            type="url"
            placeholder="https://flipkart.com/your-book"
            prefix={<ExternalLink size={16} />}
          />
        </div>
      </div>
      
      {/* Publication Details */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
        <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
          <BarChart2 size={18} className="text-indigo-600 mr-2" />
          Publication Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <InputField
            label="Publication ID"
            name="publication.publicationId"
            required
          />
          
          <InputField
            label="Published Date"
            name="publication.publishedDate"
            required
            type="date"
          />
          
          <InputField
            label="Rating (0-5)"
            name="publication.rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
          />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <TextareaField
            label="Description"
            name="publication.description"
            required
            placeholder="Enter a description of the book"
            rows={4}
          />
        </div>
      </div>
      
      {/* Book Cover */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
        <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
          <BookOpen size={18} className="text-indigo-600 mr-2" />
          Book Cover
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <InputField
            label="Cover Image URL"
            name="coverImage"
            type="url"
            placeholder="https://example.com/book-cover.jpg"
          />
          
          <div className="flex items-center">
            {previewImage ? (
              <div className="h-24 w-16 border rounded-md overflow-hidden mr-4 shadow-sm">
                <img 
                  src={previewImage} 
                  alt="Cover preview" 
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/150x200?text=Invalid+URL';
                  }}
                />
              </div>
            ) : (
              <div className="h-24 w-16 border rounded-md flex items-center justify-center bg-gray-100 mr-4">
                <BookOpen size={20} className="text-gray-400" />
              </div>
            )}
            <div className="text-sm text-gray-600">
              {previewImage ? "Cover preview" : "No cover image URL provided"}
            </div>
          </div>
        </div>
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          isLoading={isSubmitting}
        >
          {isEditing ? 'Save Changes' : 'Add Book'}
        </Button>
      </div>
    </form>
  );
};

// Main BookManagement component
const BookManagement = () => {
  // Get books data and operations
  const {
    books,
    authors,
    isLoading,
    isError,
    error,
    refetch,
    addBook,
    updateBook,
    deleteBook,
    isAddingBook,
    isUpdatingBook,
    isDeletingBook
  } = useBooks();

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  // Pagination
  const itemsPerPage = 8;

  // Filter books based on search and category
  const filteredBooks = useMemo(() => {
    return books?.filter(book => {
      const matchesSearch = 
        (book.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (typeof book.authorId === 'object' && book.authorId?.name && 
         book.authorId.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || 
        (book.category?.toLowerCase() || '').includes(selectedCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    }) || [];
  }, [books, searchQuery, selectedCategory]);

  // Pagination
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const paginatedBooks = useMemo(() => {
    return filteredBooks.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredBooks, currentPage, itemsPerPage]);

  // Get unique categories from books
  const uniqueCategories = useMemo(() => {
    return [...new Set(books?.map(book => book.category) || [])].filter(Boolean);
  }, [books]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset page when search or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Handle adding a book
  const handleAddBook = async (data: BookFormValues) => {
    try {
      await addBook(data);
      setIsAddModalOpen(false);
      setSuccessMessage('Book added successfully!');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error adding book:', err);
      setErrorMessage(`Failed to add book: ${err.message || 'Unknown error'}`);
      setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
    }
  };

  // Handle editing a book
  const handleEditBook = (book: Book) => {
    setSelectedBook(book);
    setIsEditModalOpen(true);
  };

  // Handle updating a book
  const handleUpdateBook = async (data: BookFormValues) => {
    if (!selectedBook) return;
    
    try {
      await updateBook({ id: selectedBook.id, data });
      setIsEditModalOpen(false);
      setSelectedBook(null);
      setSuccessMessage('Book updated successfully!');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error updating book:', err);
      setErrorMessage(`Failed to update book: ${err.message || 'Unknown error'}`);
      setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
    }
  };

  // Handle initiating delete
  const handleDeleteInitiate = (id: string | number) => {
    const bookToDelete = books.find(book => book.id === id);
    if (bookToDelete) {
      setSelectedBook(bookToDelete);
      setIsDeleteConfirmOpen(true);
    }
  };

  // Handle confirming delete
  const handleDeleteConfirm = async () => {
    if (!selectedBook) return;
    
    try {
      await deleteBook(selectedBook.id);
      setSuccessMessage('Book deleted successfully!');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error deleting book:', err);
      setErrorMessage(`Failed to delete book: ${err.message || 'Unknown error'}`);
      setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
    }
  };

  // For CSS animations
  useEffect(() => {
    // Add CSS for animations
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes fadeInDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes zoomIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="px-4 sm:px-6 py-6 max-w-full">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="text-indigo-600" size={28} />
            Book Management
          </h2>
          <p className="text-gray-500 mt-1">Manage books, stock, and publication details</p>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          icon={<Plus size={18} />}
        >
          Add New Book
        </Button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <Alert
          variant="success"
          message={successMessage}
          onDismiss={() => setSuccessMessage(null)}
        />
      )}
      
      {errorMessage && (
        <Alert
          variant="error"
          title="Error"
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}
      
      {isError && (
        <Alert
          variant="error"
          title="Failed to load books"
          message={`${error}`}
          onDismiss={() => {}}
        />
      )}

      {/* Filters */}
      <BookFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        viewMode={viewMode}
        setViewMode={setViewMode}
        categories={uniqueCategories}
      />

      {/* Book List/Grid */}
      {viewMode === 'list' ? (
        <BookList
          books={paginatedBooks}
          isLoading={isLoading}
          onEdit={handleEditBook}
          onDelete={handleDeleteInitiate}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      ) : (
        <BookGrid
          books={paginatedBooks}
          isLoading={isLoading}
          onEdit={handleEditBook}
          onDelete={handleDeleteInitiate}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={filteredBooks.length}
        itemsPerPage={itemsPerPage}
      />

      {/* Add Book Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Book"
        size="lg"
      >
        <BookForm
          authors={authors}
          onSubmit={handleAddBook}
          onCancel={() => setIsAddModalOpen(false)}
          isSubmitting={isAddingBook}
        />
      </Modal>

      {/* Edit Book Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Book: ${selectedBook?.title}`}
        size="lg"
      >
        {selectedBook && (
          <BookForm
            book={selectedBook}
            authors={authors}
            onSubmit={handleUpdateBook}
            onCancel={() => setIsEditModalOpen(false)}
            isSubmitting={isUpdatingBook}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Book"
        message={`Are you sure you want to delete "${selectedBook?.title}"? This action cannot be undone.`}
        confirmLabel={isDeletingBook ? "Deleting..." : "Delete"}
        variant="danger"
      />
    </div>
  );
};

export default BookManagement;