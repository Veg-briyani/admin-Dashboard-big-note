import React, { useState, useEffect } from 'react';
import {
  Package,
  RefreshCw,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  ShoppingCart,
  CalendarDays,
  Loader,
  CreditCard
} from 'lucide-react';

interface Order {
  _id: string;
  quantity: number;
  totalCost: number;
  paymentStatus: string;
  paymentMethod: string;
  orderStatus: string;
  createdAt: string;
  author: {
    name: string;
    _id: string;
  };
  book: {
    title: string;
    _id: string;
  };
}

const OrdersContent = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    // Filter orders based on status and search query
    let filtered = orders;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order =>
        order.orderStatus.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order._id.toLowerCase().includes(query) ||
        (order.author?.name && order.author.name.toLowerCase().includes(query)) ||
        (order.book?.title && order.book.title.toLowerCase().includes(query))
      );
    }

    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [statusFilter, searchQuery, orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Get the authentication token from localStorage
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');

      // Make the API request with Authorization header
      const response = await fetch('https://backendrepo-225c.onrender.com/api/admin/orders', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Include the token in Authorization header
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include' // Include cookies if your API uses cookie-based auth
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      setOrders(data);
      setFilteredOrders(data);
      setLoading(false);
    } catch (err: unknown) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processing':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processing':
        return <Clock size={14} className="mr-1" />;
      case 'shipped':
        return <Truck size={14} className="mr-1" />;
      case 'delivered':
        return <CheckCircle2 size={14} className="mr-1" />;
      case 'cancelled':
        return <AlertCircle size={14} className="mr-1" />;
      default:
        return <ShoppingCart size={14} className="mr-1" />;
    }
  };

  const handleRefresh = () => {
    fetchOrders();
  };

  // Get current orders for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

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
          className={`w-8 h-8 rounded-md flex items-center justify-center \${
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
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-indigo-600" size={28} />
            Order Management
          </h2>
          <p className="text-gray-500 mt-1">Track and manage customer orders and shipments</p>
        </div>
        <button
          onClick={handleRefresh}
          className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 transition-colors flex items-center gap-2"
          title="Refresh orders"
        >
          <RefreshCw size={18} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search and filter bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search orders or authors..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Orders</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main content card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader size={24} className="animate-spin text-indigo-600 mr-3" />
            <span className="text-gray-600 font-medium">Loading orders...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <AlertCircle className="text-red-500 mb-3" size={36} />
            <p className="text-gray-800 font-medium mb-2">{error}</p>
            <p className="text-gray-500 mb-4">There was a problem loading your orders</p>
            <button
              onClick={handleRefresh}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Package className="text-gray-400 mb-3" size={48} />
            <p className="text-gray-800 font-medium">No orders found</p>
            {searchQuery || statusFilter !== 'all' ? (
              <p className="text-gray-500 mt-2">
                Try adjusting your search or filter criteria
                <button
                  className="text-indigo-600 hover:text-indigo-800 ml-2 font-medium"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                >
                  Clear all filters
                </button>
              </p>
            ) : (
              <p className="text-gray-500 mt-2">New orders will appear here once they are placed</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left bg-gray-50">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Book & Author</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItems.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-800">#{order._id.substring(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{order.book?.title || 'Unknown Book'}</div>
                      <div className="text-sm text-gray-500">by {order.author?.name || 'Unknown Author'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-700">{order.quantity} {order.quantity === 1 ? 'copy' : 'copies'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-800">{formatCurrency(order.totalCost)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className={`inline-flex items-center text-xs font-medium px-3 py-1 rounded-full \${
                          order.paymentStatus === 'Paid'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {order.paymentStatus === 'Paid' ?
                            <CheckCircle2 size={14} className="mr-1" /> :
                            <AlertCircle size={14} className="mr-1" />
                          }
                          {order.paymentStatus}
                        </span>
                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                          <CreditCard size={12} className="mr-1" />
                          {order.paymentMethod}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center text-xs font-medium px-3 py-1 rounded-full ${getStatusBadgeClass(order.orderStatus)}`}>
                        {getStatusIcon(order.orderStatus)}
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-gray-700">
                        <CalendarDays size={14} className="mr-1 text-gray-500" />
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {order.orderStatus === 'Delivered' ? (
                          <button className="text-indigo-600 hover:text-indigo-800 flex items-center font-medium text-sm">
                            <FileText size={14} className="mr-1" />
                            Review
                          </button>
                        ) : order.orderStatus === 'Shipped' ? (
                          <button className="text-indigo-600 hover:text-indigo-800 flex items-center font-medium text-sm">
                            <Truck size={14} className="mr-1" />
                            Track
                          </button>
                        ) : (
                          <button className="text-indigo-600 hover:text-indigo-800 flex items-center font-medium text-sm">
                            <ExternalLink size={14} className="mr-1" />
                            Update
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && filteredOrders.length > itemsPerPage && (
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length} orders
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className={`w-8 h-8 flex items-center justify-center rounded-md \${
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
                className={`w-8 h-8 flex items-center justify-center rounded-md \${
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
    </div>
  );
};

export default OrdersContent;