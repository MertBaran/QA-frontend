import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { getCurrentUser } from '../store/slices/authSlice';
import Loading from '../components/ui/Loading';
import { useEffect } from 'react';

// Route components
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

// Route configuration
import { publicRoutes, protectedRoutes, catchAllRoute } from './config';

// Page components
import * as Pages from '../pages';

const AppRoutes = () => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector(state => state.auth);

  useEffect(() => {
    // Check if user is already logged in on app start
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

  if (loading) {
    return <Loading message="Loading application..." />;
  }

  // Helper function to render page component
  const renderPageComponent = componentName => {
    const PageComponent = Pages[componentName];
    return PageComponent ? <PageComponent /> : <div>Page not found</div>;
  };

  return (
    <Routes>
      {/* Public Routes */}
      {publicRoutes.map(({ path, component: ComponentName }) => (
        <Route
          key={path}
          path={path}
          element={
            <PublicRoute>{renderPageComponent(ComponentName)}</PublicRoute>
          }
        />
      ))}

      {/* Protected Routes */}
      {protectedRoutes.map(({ path, component: ComponentName }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute>
              {renderPageComponent(ComponentName)}
            </ProtectedRoute>
          }
        />
      ))}

      {/* Catch all route */}
      <Route
        path={catchAllRoute.path}
        element={<Navigate to={catchAllRoute.redirect} replace />}
      />
    </Routes>
  );
};

export default AppRoutes;
