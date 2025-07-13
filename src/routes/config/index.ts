// Import all route configurations
import { authRoutes } from './authRoutes';
import { questionRoutes } from './questionRoutes';
import { userRoutes, homeRoute } from './userRoutes';

// Combine public routes
export const publicRoutes = [...authRoutes];

// Combine protected routes
export const protectedRoutes = [...homeRoute, ...questionRoutes, ...userRoutes];

// Catch all route
export const catchAllRoute = {
  path: '*',
  redirect: '/',
};
