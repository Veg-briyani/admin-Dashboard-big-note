import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../services/authContext';

interface ProtectedRouteProps {
  redirectPath?: string;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ 
  redirectPath = '/login',
  allowedRoles = ['admin'] 
}: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute; 