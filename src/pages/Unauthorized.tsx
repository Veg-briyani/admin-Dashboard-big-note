import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';

const Unauthorized = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBackToLogin = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600 mb-4">401</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">Unauthorized Access</h2>
        <p className="text-gray-600 mb-8 max-w-md">
          Sorry, you don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <div className="space-x-4">
          <button
            onClick={handleLogout}
            className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Log Out
          </button>
          <button
            onClick={handleBackToLogin}
            className="bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized; 