import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PageLoader } from '../components/common/Loader';

const ProtectedRoute = () => {
  const { user, authChecking } = useAuth();

  // Show premium loading spinner while checking for active sessions
  if (authChecking) {
    return <PageLoader message="Verifying session credentials..." />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Render children routes
  return <Outlet />;
};

export default ProtectedRoute;
