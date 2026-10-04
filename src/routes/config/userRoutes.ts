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
  {
    path: '/bookmarks',
    component: 'BookmarkDetail',
    exact: true,
  },
];

// Public shared content (no auth - incognito/gizli sekme)
export const sharedContentRoutes = [
  {
    path: '/bookmarks/shared/t/:token',
    component: 'BookmarkSharedView',
    exact: true,
  },
  {
    path: '/bookmarks/shared/:collectionId',
    component: 'BookmarkSharedView',
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
