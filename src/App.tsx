import "./index.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
// import DashboardContent from './components/dashboard/DashboardContent';
import UsersContent from './components/users/UsersContent';
import BooksContent from './components/books/BooksContent';
import KYCContent from './components/kyc/KYCDashboard';
import RoyaltiesContent from './components/royalties/RoyaltiesContent';
import OrdersContent from './components/orders/OrdersContent';
import PrintsContent from './components/prints/PrintsContent';
import NotificationsContent from './components/notifications/NotificationsContent';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuth } from './services/authContext';
import NotificationHistoryDashboard from "./components/notifications/NotificationHistoryDashboard";
import AdminNotificationDashboard from "./components/notifications/AdminNotificationDashboard";
import FakePurchasesPage from "./pages/FakePurchasesPage";

function App() {
  const { isAuthenticated } = useAuth();

  // Opt into React Router v7 features
  const routerOptions = {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  };

  return (
    <Router {...routerOptions}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Redirect root to dashboard if logged in, otherwise to login */}
        <Route 
          path="/" 
          element={<RootRedirect isAuthenticated={isAuthenticated} />} 
        />
        
        {/* Protected admin routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminDashboard />}>
            <Route index element={<Navigate to="/admin/notifications" replace />} />
            <Route path="users" element={<UsersContent />} />
            <Route path="books" element={<BooksContent />} />
            <Route path="kyc" element={<KYCContent />} />
            <Route path="royalties" element={<RoyaltiesContent />} />
            <Route path="orders" element={<OrdersContent />} />
            <Route path="prints" element={<PrintsContent />} />
            <Route path="notifications" element={<NotificationsContent />} />
            <Route path="NotificationHistoryDashboard" element={<NotificationHistoryDashboard/>} />
            <Route path="AdminNotificationDashboard" element={<AdminNotificationDashboard/>} />
            <Route path="PurchasesPage" element={<FakePurchasesPage/>} />
          </Route>
        </Route>
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

// Separate component to handle root redirects to prevent infinite loops
function RootRedirect({ isAuthenticated }: { isAuthenticated: boolean }) {
  if (isAuthenticated) {
    return <Navigate to="/admin/notifications" replace />;
  }
  return <Navigate to="/login" replace />;
}

export default App;
