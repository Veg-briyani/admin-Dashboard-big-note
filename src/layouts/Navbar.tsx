import { useLocation } from 'react-router-dom';
import { Bell, LogOut, ChevronRight, Search, Settings, User, Menu } from 'lucide-react';
import { useAuth } from '../services/authContext';
import { useState, useEffect } from 'react';

interface NavbarProps {
  onMenuClick?: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentPath = pathSegments.pop() || 'dashboard';
  const formattedTitle = currentPath.charAt(0).toUpperCase() + currentPath.slice(1);
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const handleLogout = () => {
    logout();
  };

  // Simulate notification count
  const notificationCount = 5;

  return (
    <div className={`bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-3 sticky top-0 z-30 transition-all duration-200 ${
      scrolled ? 'shadow-md' : ''
    }`}>
      <div className="flex justify-between items-center">
        {/* Left side - Title and breadcrumb */}
        <div className="flex items-center">
          {/* Mobile menu button */}
          <button 
            className="mr-4 p-2 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 md:hidden transition-colors"
            onClick={onMenuClick}
            aria-label="Toggle menu"
          >
            <Menu size={22} />
          </button>
          
          <div>
            <div className="flex items-center text-xs text-gray-400 mb-1 font-medium">
              <span className="hidden sm:inline">Admin</span>
              {pathSegments.map((segment, index) => (
                <span key={index} className="flex items-center">
                  <ChevronRight size={12} className="mx-1" />
                  <span className="capitalize hidden sm:inline">{segment}</span>
                </span>
              ))}
              <ChevronRight size={12} className="mx-1 hidden sm:block" />
              <span className="text-indigo-500 font-medium capitalize">{currentPath}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">
              {formattedTitle}
            </h1>
          </div>
        </div>

        {/* Right side - Search, notifications and profile */}
        <div className="flex items-center space-x-1 sm:space-x-4">
          {/* Search */}
          <div className="hidden md:flex items-center relative">
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 rounded-full bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm w-64 transition-all hover:bg-white"
            />
            <Search size={16} className="absolute left-3.5 text-gray-400" />
          </div>
          
          {/* Notifications */}
          <div className="relative">
            <button className="w-10 h-10 rounded-full bg-gray-50 hover:bg-white flex items-center justify-center text-gray-600 hover:text-indigo-600 transition-colors hover:shadow-md relative border border-gray-100">
              <Bell size={18} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          </div>
          
          {/* User profile */}
          <div className="relative">
            <div 
              className="flex items-center cursor-pointer py-2 px-1 hover:bg-gray-50 rounded-xl transition-colors"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-medium shadow-sm ring-2 ring-white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="ml-3 hidden md:block">
                <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role || 'Author'}</p>
              </div>
              <ChevronRight size={16} className="ml-1 text-gray-400 hidden md:block transition-transform duration-200" style={{ transform: showDropdown ? 'rotate(90deg)' : 'rotate(0deg)' }} />
            </div>
            
            {/* Dropdown menu */}
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 w-60 bg-white/95 backdrop-blur-md rounded-xl shadow-lg py-3 border border-gray-100 z-10 animate-fadeIn overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-100 mb-2">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <a href="#profile" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 mr-3">
                    <User size={16} />
                  </div>
                  <span>Your Profile</span>
                </a>
                <a href="#settings" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 mr-3">
                    <Settings size={16} />
                  </div>
                  <span>Settings</span>
                </a>
                <div className="my-1 border-t border-gray-100"></div>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center"
                >
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 mr-3">
                    <LogOut size={16} />
                  </div>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;