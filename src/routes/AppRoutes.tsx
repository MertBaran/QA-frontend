import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAppSelector } from '../store/hooks';
import Loading from '../components/ui/Loading';

// Route components
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import AdminLayout from '../components/layout/AdminLayout';

// Route configuration
import { publicRoutes, protectedRoutes, adminProtectedRoutes, catchAllRoute } from './config';

// Lazy load page components
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const Home = lazy(() => import('../pages/Home'));
const Questions = lazy(() => import('../pages/question/Questions'));
const QuestionDetail = lazy(() => import('../pages/question/QuestionDetail'));
const AskQuestion = lazy(() => import('../pages/question/AskQuestion'));
const Profile = lazy(() => import('../pages/user/Profile'));
const TestError = lazy(() => import('../pages/TestError'));
const NotFound = lazy(() => import('../pages/NotFound'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));

// Admin page components
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'));
const AdminQuestions = lazy(() => import('../pages/admin/AdminQuestions'));
const AdminAnswers = lazy(() => import('../pages/admin/AdminAnswers'));
const AdminPermissions = lazy(() => import('../pages/admin/AdminPermissions'));
const AdminRoles = lazy(() => import('../pages/admin/AdminRoles'));
const AdminSettings = lazy(() => import('../pages/admin/AdminSettings'));

// Page component mapping
const Pages = {
  Login,
  Register,
  Home,
  Questions,
  QuestionDetail,
  AskQuestion,
  Profile,
  TestError,
  NotFound,
  ResetPassword,
  ForgotPassword,
  // Admin pages
  AdminDashboard,
  AdminUsers,
  AdminQuestions,
  AdminAnswers,
  AdminPermissions,
  AdminRoles,
  AdminSettings,
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

      {/* Admin Routes */}
      {adminProtectedRoutes.map(({ path, component: ComponentName }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                {renderPageComponent(ComponentName as keyof typeof Pages)}
              </AdminLayout>
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
