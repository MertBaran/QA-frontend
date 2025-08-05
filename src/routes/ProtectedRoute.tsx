import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import Loading from '../components/ui/Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, hasAdminPermission, loading } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // Loading durumunda bekle
  if (loading) {
    return <Loading message="Checking authentication..." />;
  }

  // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin yetkisi gerekiyorsa ve kullanıcının admin yetkisi yoksa ana sayfaya yönlendir
  if (requireAdmin && !hasAdminPermission) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
