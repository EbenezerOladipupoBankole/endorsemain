import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/AuthContext';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-gray-500 animate-pulse">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to auth page but save the current location they were trying to access
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!user.emailVerified) {
    // Redirect to auth page if email is not verified
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;