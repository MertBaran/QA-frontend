// User routes (protected)
export const userRoutes = [
  {
    path: '/profile/:userId',
    component: 'Profile',
    exact: true,
  },
  {
    path: '/profile',
    component: 'Profile',
    exact: true,
  },
];

// Home route (protected)
export const homeRoute = [
  {
    path: '/',
    component: 'Home',
    exact: true,
  },
];
