import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../layouts/Sidebar';
import Navbar from '../layouts/Navbar';

const AdminDashboard = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [isLoaded, setIsLoaded] = useState(false);

  // Handle window resize and update mobile view state
  useEffect(() => {
    const handleResize = () => {
      const mobileView = window.innerWidth < 768;
      setIsMobileView(mobileView);
      if (!mobileView && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  // Add page load animation
  useEffect(() => {
    // Short delay for smoother animation
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      if (isMobileMenuOpen && sidebar && !sidebar.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Toggle mobile menu
  const handleMenuToggle = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  return (
    <div className={`flex h-screen bg-gray-50 overflow-hidden ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
      {/* Sidebar - desktop view is always visible, mobile is toggleable */}
      <div 
        id="sidebar"
        className={`${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out fixed md:relative z-30 h-full`}
      >
        <Sidebar />
      </div>

      {/* Mobile menu overlay with blur effect */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={handleMenuToggle} />
        
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50 custom-scrollbar">
          {/* Container with max width and auto margins for nicer layout */}
          <div className="max-w-7xl mx-auto">
            {/* Page content */}
            <div className="transition-opacity duration-300 ease-in-out opacity-100 animate-fadeIn">
              <Outlet />
            </div>
            
            {/* Footer */}
            <footer className="mt-8 text-center py-4 text-gray-400 text-xs">
              <p>© {new Date().getFullYear()} Bignote. All rights reserved.</p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;