export const publicRoutes = [
  "/",
  "/docs",
  "/auth/verify-email",
  "/auth/error",
  "/api/auth",
  "/api/v1",
];

export const publicRoutePatterns = [
  /^\/docs(\/.*)?$/,
];

export const authRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
];

export const DEFAULT_LOGIN_REDIRECT = "/dashboard";
export const DEFAULT_AUTH_REDIRECT = "/auth/login";
