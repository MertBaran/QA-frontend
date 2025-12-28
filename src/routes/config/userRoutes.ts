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
  {
    path: '/inquire',
    component: 'Inquire',
    exact: true,
  },
  {
    path: '/query',
    component: 'Query',
    exact: true,
  },
  {
    path: '/search',
    component: 'Search',
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
