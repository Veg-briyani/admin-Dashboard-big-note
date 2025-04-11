import { Link, useMatch } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Bell,
  BookOpen,
  DollarSign,
  Printer,
  Users,
  Package,
  AlertTriangle,
  BookText,
  History,
  ShoppingBag,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../services/authContext';

interface SidebarItemProps {
  icon: React.ReactNode;
  title: string;
  to: string;
  badge?: number;
  isCollapsed: boolean;
}

const SidebarItem = ({ icon, title, to, badge = 0, isCollapsed }: SidebarItemProps) => {
  const isActive = !!useMatch(to);

  return (
    <Link 
      to={to} 
      className={`flex items-center py-2.5 px-4 rounded-xl transition-all duration-200 mb-1.5 group relative ${
        isActive 
          ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-sm' 
          : 'text-indigo-100 hover:bg-white/10'
      }`}
      aria-label={title}
    >
      <div className={`flex items-center justify-center w-6 ${
        isActive ? 'text-white' : 'text-indigo-300 group-hover:text-white'
      }`}>
        {icon}
      </div>
      
      {!isCollapsed && (
        <>
          <span className="ml-3 font-medium text-sm">{title}</span>
          {badge > 0 && (
            <div className={`ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${
              isActive ? 'bg-white text-indigo-600' : 'bg-indigo-500/80 text-white'
            }`}>
              {badge}
            </div>
          )}
        </>
      )}
      
      {isCollapsed && badge > 0 && (
        <div className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-indigo-500 text-white text-xs font-bold rounded-full">
          {badge}
        </div>
      )}
      
      {/* Right-side visual indicator for active item */}
      {isActive && !isCollapsed && (
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 h-8 w-1 bg-white rounded-l-full"></div>
      )}
    </Link>
  );
};

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  isCollapsed: boolean;
}

const SidebarSection = ({ title, children, isCollapsed }: SidebarSectionProps) => {
  return (
    <div className="mb-6">
      {!isCollapsed && (
        <div className="px-4 mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-300/70">
            {title}
          </h3>
        </div>
      )}
      <div className="space-y-1 px-2">
        {children}
      </div>
    </div>
  );
};

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMiniProfile, setShowMiniProfile] = useState(false);
  const { user, logout } = useAuth();
  
  // Handle window size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      className={`h-screen bg-gradient-to-b from-indigo-800 via-indigo-700 to-indigo-900 text-white flex flex-col shadow-xl transition-all duration-300 relative ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Glass overlay on the background for modern effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-800/90 to-indigo-900/80 backdrop-blur-sm -z-10"></div>
      
      <div className={`p-4 flex ${isCollapsed ? 'justify-center' : 'justify-between'} items-center border-b border-indigo-600/30`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/10 rounded-lg shadow-inner">
              <BookText size={22} className="text-white" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-wide text-white">Bignote</div>
              <div className="text-xs text-indigo-200 font-medium">Admin Panel</div>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="p-1.5 bg-white/10 rounded-lg shadow-inner">
            <BookText size={20} className="text-white" />
          </div>
        )}
        
        <button 
          className={`w-7 h-7 rounded-full flex items-center justify-center text-indigo-200 hover:bg-white/10 transition-colors ${isCollapsed ? 'hidden' : 'block'}`}
          onClick={() => setIsCollapsed(true)}
          aria-label="Collapse sidebar"
        >
          <ChevronLeft size={18} />
        </button>
        <button 
          className={`w-7 h-7 rounded-full flex items-center justify-center text-indigo-200 hover:bg-white/10 transition-colors ${isCollapsed ? 'block' : 'hidden'}`}
          onClick={() => setIsCollapsed(false)}
          aria-label="Expand sidebar"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* User profile in sidebar */}
      {!isCollapsed && (
        <div className="mx-3 mt-4 p-3 bg-white/10 rounded-xl">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-medium shadow-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
              <p className="text-xs text-indigo-200 capitalize">{user?.role || 'Admin'}</p>
            </div>
          </div>
        </div>
      )}
      
      {isCollapsed && (
        <div className="mx-3 mt-4 p-1.5 relative">
          <button 
            className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-medium shadow-sm mx-auto hover:shadow-lg transition-shadow"
            onMouseEnter={() => setShowMiniProfile(true)}
            onMouseLeave={() => setShowMiniProfile(false)}
          >
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </button>
          
          {showMiniProfile && (
            <div className="absolute left-14 top-0 bg-white rounded-xl shadow-lg p-3 w-48 z-50 animate-fadeIn">
              <div className="flex flex-col">
                <p className="text-sm font-medium text-gray-800">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role || 'Admin'}</p>
                <button 
                  onClick={logout}
                  className="mt-2 flex items-center text-xs text-red-600 hover:text-red-700"
                >
                  <LogOut size={12} className="mr-1" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto mt-3 custom-scrollbar">
        <SidebarSection title="Management" isCollapsed={isCollapsed}>
          <SidebarItem 
            icon={<Users size={18} />} 
            title="User Management" 
            to="/admin/users" 
            isCollapsed={isCollapsed}
          />
          <SidebarItem 
            icon={<BookOpen size={18} />} 
            title="Book Management" 
            to="/admin/books" 
            isCollapsed={isCollapsed}
          />
          <SidebarItem 
            icon={<AlertTriangle size={18} />} 
            title="KYC Verification" 
            to="/admin/kyc" 
            badge={5}
            isCollapsed={isCollapsed} 
          />
          <SidebarItem 
            icon={<Package size={18} />} 
            title="Order Management" 
            to="/admin/orders"
            isCollapsed={isCollapsed} 
          />
        </SidebarSection>

        <SidebarSection title="Financial" isCollapsed={isCollapsed}>
          <SidebarItem 
            icon={<DollarSign size={18} />} 
            title="Royalty Management" 
            to="/admin/royalties" 
            badge={3}
            isCollapsed={isCollapsed} 
          />
          <SidebarItem 
            icon={<Printer size={18} />} 
            title="Print Logs" 
            to="/admin/prints"
            isCollapsed={isCollapsed} 
          />
        </SidebarSection>

        <SidebarSection title="System" isCollapsed={isCollapsed}>
          <SidebarItem 
            icon={<Bell size={18} />} 
            title="Notifications" 
            to="/admin/notifications" 
            badge={8}
            isCollapsed={isCollapsed} 
          />
          <SidebarItem 
            icon={<History size={18} />} 
            title="Notification History" 
            to="/admin/notification-history" 
            badge={8}
            isCollapsed={isCollapsed} 
          />
          <SidebarItem 
            icon={<ShoppingBag size={18} />} 
            title="Fake Purchases" 
            to="/admin/fake-purchases"
            isCollapsed={isCollapsed} 
          />
        </SidebarSection>
      </div>

      <div className={`px-4 py-3 mt-auto border-t border-indigo-600/30 ${isCollapsed ? 'text-center' : ''}`}>
        {!isCollapsed ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <div className="text-xs text-indigo-200">
              Dashboard v1.0
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;