import { useLocation } from 'react-router-dom';
import { Bell, LogOut, ChevronRight, Search } from 'lucide-react';
import { useAuth } from '../services/authContext';
import { useState } from 'react';

const Navbar = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentPath = pathSegments.pop() || 'dashboard';
  const formattedTitle = currentPath.charAt(0).toUpperCase() + currentPath.slice(1);
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
  };

  // Simulate notification count
  const notificationCount = 5;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center">
      {/* Left side - Title and breadcrumb */}
      <div>
        <div className="flex items-center text-sm text-gray-500 mb-1">
          <span>Admin</span>
          {pathSegments.map((segment, index) => (
            <span key={index} className="flex items-center">
              <ChevronRight size={14} className="mx-1" />
              <span className="capitalize">{segment}</span>
            </span>
          ))}
          <ChevronRight size={14} className="mx-1" />
          <span className="text-indigo-600 font-medium capitalize">{currentPath}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">
          {formattedTitle}
        </h1>
      </div>

      {/* Right side - Search, notifications and profile */}
      <div className="flex items-center space-x-6">
        {/* Search */}
        <div className="hidden md:flex items-center relative">
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-9 pr-4 py-2 rounded-lg bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm w-64 transition-all"
          />
          <Search size={18} className="absolute left-3 text-gray-400" />
        </div>
        
        {/* Notifications */}
        <div className="relative">
          <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
            <Bell size={18} />
          </button>
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </div>
        
        {/* User profile */}
        <div className="relative">
          <div 
            className="flex items-center cursor-pointer py-2"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 flex items-center justify-center text-white font-medium shadow-sm">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 hidden md:block">
              <p className="text-sm font-medium text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-500">Author</p>
            </div>
          </div>
          
          {/* Dropdown menu */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200 z-10">
              <a href="#profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Your Profile</a>
              <a href="#settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</a>
              <div className="my-1 border-t border-gray-200"></div>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
              >
                <LogOut size={16} className="mr-2" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;