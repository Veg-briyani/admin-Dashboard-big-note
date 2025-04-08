import React from 'react';


const StatCard = ({ 
  title, 
  value, 
  icon, 
  change 
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: string;
}) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-gray-500 text-sm">{title}</h3>
        <div className="text-2xl font-bold mt-1">{value}</div>
        {change && <div className="text-xs text-gray-500 mt-1">{change}</div>}
      </div>
      <div className="p-2 rounded-lg bg-indigo-50">
        {icon}
      </div>
    </div>
  </div>
);

export default StatCard; 