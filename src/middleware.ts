import { NextRequest, NextResponse } from "next/server";
import {
  publicRoutes,
  publicRoutePatterns,
  authRoutes,
  DEFAULT_LOGIN_REDIRECT,
  DEFAULT_AUTH_REDIRECT,
} from "@/lib/routes";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Maintenance mode flag (can be toggled via NEXT_PUBLIC_MAINTENANCE_MODE env var, defaults to true)
  const isMaintenanceActive = process.env.NEXT_PUBLIC_MAINTENANCE_MODE !== "false";

  const isMaintenancePage =
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/maintainance") ||
    pathname.startsWith("/api/maintenance/notify");

  if (isMaintenanceActive) {
    if (!isMaintenancePage) {
      return NextResponse.redirect(new URL("/maintenance", request.url));
    }
    return NextResponse.next();
  }

  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  const isAuthenticated = !!sessionToken;

  const isPublicRoute =
    publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/")) ||
    publicRoutePatterns.some((pattern) => pattern.test(pathname));

  const isAuthRoute = authRoutes.some((route) => pathname === route);

  // Auth routes: authenticated users get redirected away, unauthenticated can access
  if (isAuthRoute) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, request.url));
    }
    return NextResponse.next();
  }

  // Public routes: always accessible
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protected routes: must be authenticated
  if (!isAuthenticated) {
    const loginUrl = new URL(DEFAULT_AUTH_REDIRECT, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();

  if (!isPublicRoute) {
    response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;

}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/v1).*)",
  ],
};
