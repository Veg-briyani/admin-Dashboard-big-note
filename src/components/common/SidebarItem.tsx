import React from 'react';
import { LucideIcon } from 'lucide-react';

const SidebarItem = ({
  icon,
  title,
  active,
  onClick,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) => (
  <div
    className={`flex items-center justify-between px-6 py-3 cursor-pointer ${
      active ? 'bg-indigo-900' : 'hover:bg-indigo-700'
    }`}
    onClick={onClick}
  >
    <div className="flex items-center">
      {icon}
      <span className="ml-2">{title}</span>
    </div>
    {typeof badge !== 'undefined' && (
      <span className="bg-red-500 text-white rounded-full px-2 py-1 text-xs">
        {badge}
      </span>
    )}
  </div>
);

export default SidebarItem; 