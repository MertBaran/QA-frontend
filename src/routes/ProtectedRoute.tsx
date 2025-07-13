import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import Loading from '../components/ui/Loading';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAppSelector(state => state.auth);

  if (loading) {
    return <Loading message="Checking authentication..." />;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
