import {  Link, useMatch } from 'react-router-dom';

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
} from 'lucide-react';
import clsx from 'clsx'; // For cleaner class name handling

interface EnhancedSidebarItemProps {
  icon: React.ReactNode;
  title: string;
  active: boolean;
  badge: number;
  onClick?: () => void;
}

const EnhancedSidebarItem = ({
  icon,
  title,
  active,
  badge,
  onClick,
}: EnhancedSidebarItemProps) => {
  return (
    <div
      className={clsx(
        'flex items-center px-6 py-3 mx-3 my-1 rounded-lg cursor-pointer transition-all duration-200 group',
        active
          ? 'bg-indigo-700 text-white shadow-md'
          : 'text-indigo-100 hover:bg-indigo-700/50'
      )}
      onClick={onClick}
    >
      <div
        className={clsx(
          'transition-colors duration-200',
          active ? 'text-white' : 'text-indigo-300 group-hover:text-white'
        )}
      >
        {icon}
      </div>
      <span className="ml-3 font-medium">{title}</span>
      {badge > 0 && (
        <div
          className={clsx(
            'ml-auto flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-xs font-semibold',
            active ? 'bg-white text-indigo-800' : 'bg-indigo-600 text-white'
          )}
        >
          {badge}
        </div>
      )}
    </div>
  );
};

const Sidebar = () => {
  const usersMatch = useMatch('/admin/users');
  const booksMatch = useMatch('/admin/books');
  const kycMatch = useMatch('/admin/kyc');
  const ordersMatch = useMatch('/admin/orders');
  const royaltiesMatch = useMatch('/admin/royalties');
  const printsMatch = useMatch('/admin/prints');
  const notificationsMatch = useMatch('/admin/notifications');
  const notificationHistoryMatch = useMatch('/admin/notification-history');
  const fakePurchasesMatch = useMatch('/admin/fake-purchases');

  return (
    <div className="w-64 h-screen bg-gradient-to-b from-indigo-800 to-indigo-900 text-white flex flex-col shadow-xl">
      <div className="p-6 border-b border-indigo-700">
        <div className="flex items-center gap-3">
          <BookText size={24} className="text-indigo-300" />
          <div>
            <div className="text-xl font-bold tracking-wide">Admin</div>
            <div className="text-sm text-indigo-300 font-medium">Dashboard</div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex-1 overflow-y-auto">
        <div className="px-3 mt-6 mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
          Management
        </div>
        <Link to="/admin/users" aria-label="User Management">
          <EnhancedSidebarItem
            icon={<Users size={20} />}
            title="User Management"
            active={!!usersMatch}
            badge={0}
          />
        </Link>
        <Link to="/admin/books" aria-label="Book Management">
          <EnhancedSidebarItem
            icon={<BookOpen size={20} />}
            title="Book Management"
            active={!!booksMatch}
            badge={0}
          />
        </Link>
        <Link to="/admin/kyc" aria-label="KYC Verification">
          <EnhancedSidebarItem
            icon={<AlertTriangle size={20} />}
            title="KYC Verification"
            active={!!kycMatch}
            badge={5}
          />
        </Link>
        <Link to="/admin/orders" aria-label="Order Management">
          <EnhancedSidebarItem
            icon={<Package size={20} />}
            title="Order Management"
            active={!!ordersMatch}
            badge={0}
          />
        </Link>

        <div className="px-3 mt-6 mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
          Financial
        </div>
        <Link to="/admin/royalties" aria-label="Royalty Management">
          <EnhancedSidebarItem
            icon={<DollarSign size={20} />}
            title="Royalty Management"
            active={!!royaltiesMatch}
            badge={3}
          />
        </Link>
        <Link to="/admin/prints" aria-label="Print Logs">
          <EnhancedSidebarItem
            icon={<Printer size={20} />}
            title="Print Logs"
            active={!!printsMatch}
            badge={0}
          />
        </Link>

        <div className="px-3 mt-6 mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
          System
        </div>
        <Link to="/admin/notifications" aria-label="Notifications">
          <EnhancedSidebarItem
            icon={<Bell size={20} />}
            title="Notifications"
            active={!!notificationsMatch}
            badge={8}
          />
        </Link>
        <Link to="/admin/notification-history" aria-label="Notification History">
          <EnhancedSidebarItem
            icon={<History size={20} />}
            title="Notification History"
            active={!!notificationHistoryMatch}
            badge={8}
          />
        </Link>
        <Link to="/admin/fake-purchases" aria-label="Fake Purchases">
          <EnhancedSidebarItem
            icon={<ShoppingBag size={20} />}
            title="Fake Purchases"
            active={!!fakePurchasesMatch}
            badge={0}
          />
        </Link>
      </div>

      <div className="p-4 mt-auto border-t border-indigo-700 text-xs text-indigo-400 text-center">
        Admin Dashboard v1.0
      </div>
    </div>
  );
};

export default Sidebar;