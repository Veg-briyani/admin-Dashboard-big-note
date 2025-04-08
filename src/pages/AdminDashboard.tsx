import { Outlet } from 'react-router-dom';
import Sidebar from '../layouts/Sidebar';
import Navbar from '../layouts/Navbar';

const AdminDashboard = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Navbar />
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 