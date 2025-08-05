// Import all route configurations
import { authRoutes } from './authRoutes';
import { questionRoutes } from './questionRoutes';
import { userRoutes, homeRoute } from './userRoutes';
import { adminRoutes } from './adminRoutes';

// Combine public routes
export const publicRoutes = [...authRoutes];

// Combine protected routes
export const protectedRoutes = [...homeRoute, ...questionRoutes, ...userRoutes];

// Admin routes (require admin permission)
export const adminProtectedRoutes = adminRoutes;

// Catch all route
export const catchAllRoute = {
  path: '*',
  redirect: '/',
};
