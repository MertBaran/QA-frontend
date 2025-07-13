import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAppSelector } from '../store/hooks';
import Loading from '../components/ui/Loading';

// Route components
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

// Route configuration
import { publicRoutes, protectedRoutes, catchAllRoute } from './config';

// Lazy load page components
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const Home = lazy(() => import('../pages/Home'));
const Questions = lazy(() => import('../pages/question/Questions'));
const AskQuestion = lazy(() => import('../pages/question/AskQuestion'));
const Profile = lazy(() => import('../pages/user/Profile'));
const TestError = lazy(() => import('../pages/TestError'));
const NotFound = lazy(() => import('../pages/NotFound'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));

// Page component mapping
const Pages = {
  Login,
  Register,
  Home,
  Questions,
  AskQuestion,
  Profile,
  TestError,
  NotFound,
  ResetPassword,
  ForgotPassword,
};

const AppRoutes = () => {
  const { loading } = useAppSelector(state => state.auth);

  if (loading) {
    return <Loading message="Loading application..." />;
  }

  // Helper function to render page component with Suspense
  const renderPageComponent = (componentName: keyof typeof Pages) => {
    const PageComponent = Pages[componentName];
    return PageComponent ? (
      <Suspense fallback={<Loading message="Loading page..." />}>
        <PageComponent />
      </Suspense>
    ) : (
      <div>Page not found</div>
    );
  };

  return (
    <Routes>
      {/* Public Routes */}
      {publicRoutes.map(({ path, component: ComponentName }) => (
        <Route
          key={path}
          path={path}
          element={
            <PublicRoute>{renderPageComponent(ComponentName as keyof typeof Pages)}</PublicRoute>
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
              {renderPageComponent(ComponentName as keyof typeof Pages)}
            </ProtectedRoute>
          }
        />
      ))}

      {/* Catch all route */}
      <Route
        path={catchAllRoute.path}
        element={<Navigate to={catchAllRoute.redirect} replace />}
      />

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
