import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import Loading from '../components/ui/Loading';
import { ReactNode } from 'react';
import { isTokenValidAndNotExpired } from '../utils/tokenUtils';

interface PublicRouteProps {
  children: ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { isAuthenticated, loading } = useAppSelector(state => state.auth);

  if (loading) {
    return <Loading message="Checking authentication..." />;
  }

  // Token geçerliliğini kontrol et
  const isTokenValid = isTokenValidAndNotExpired();
  
  return (isAuthenticated && isTokenValid) ? <Navigate to="/" replace /> : <>{children}</>;
};

export default PublicRoute;
