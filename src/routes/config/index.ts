// Import all route configurations
import { authRoutes } from './authRoutes';
import { questionRoutes } from './questionRoutes';
import { userRoutes, homeRoute, sharedContentRoutes } from './userRoutes';
import { adminRoutes } from './adminRoutes';

// Public routes (login/register - redirect to home if already logged in)
export const publicRoutes = [...authRoutes];

// Open routes (no auth check - accessible to everyone, logged in or not)
export const openRoutes = [...sharedContentRoutes];

// Combine protected routes
export const protectedRoutes = [...homeRoute, ...questionRoutes, ...userRoutes];

// Admin routes (require admin permission)
export const adminProtectedRoutes = adminRoutes;

// Catch all route
export const catchAllRoute = {
  path: '*',
  redirect: '/',
};
