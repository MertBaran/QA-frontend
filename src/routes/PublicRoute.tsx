import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import Loading from '../components/ui/Loading';
import { ReactNode } from 'react';

interface PublicRouteProps {
  children: ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { isAuthenticated, loading } = useAppSelector(state => state.auth);

  if (loading) {
    return <Loading message="Checking authentication..." />;
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
};

export default PublicRoute;
