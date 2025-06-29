// Authentication routes (public)
export const authRoutes = [
  {
    path: "/login",
    component: "Login",
    exact: true,
  },
  {
    path: "/register",
    component: "Register",
    exact: true,
  },
  {
    path: "/test-error",
    component: "TestError",
    exact: true,
  },
];
