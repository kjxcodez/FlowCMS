import { NextRequest, NextResponse } from "next/server";

/**
 * Edge-compatible middleware.
 * Does NOT import Prisma or Better Auth server libs (they require Node runtime).
 * Auth check is cookie-based; server routes verify the session properly.
 */
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const launchMode = process.env.NEXT_PUBLIC_LAUNCH_MODE || "waitlist";

  /**
   * 1. STATIC & INTERNAL ASSETS
   */
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  /**
   * 2. AUTH INFRASTRUCTURE (Public)
   */
  if (
    pathname.startsWith("/api/auth") || // Includes /api/auth/prepare
    pathname === "/auth/error"
  ) {
    return NextResponse.next();
  }

  /**
   * 3. LAUNCH GATING (Waitlist/Early Access)
   */
  if (launchMode === "waitlist" || launchMode === "early_access") {
    const isAuthRoute = pathname === "/signup" || pathname.startsWith("/register/");
    
    if (isAuthRoute) {
      const pendingInvite = request.cookies.get("pending_invite")?.value;
      const hasTokenInUrl = searchParams.has("invite");

      // Rule: /register/provider REQUIRES an invite token in the URL
      if (pathname.startsWith("/register/") && !hasTokenInUrl) {
        return NextResponse.redirect(new URL("/auth/error?code=INVITE_REQUIRED", request.url));
      }

      // Rule: /signup REQUIRES the handoff cookie from Checkpoint 1
      if (pathname === "/signup" && !pendingInvite) {
        return NextResponse.redirect(new URL("/auth/error?code=INVITE_REQUIRED", request.url));
      }
    }
  }

  /**
   * 4. PUBLIC ROUTES
   */
  const isPublicRoute = 
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/docs") ||
    pathname.startsWith("/api/waitlist") ||
    pathname.startsWith("/api/v1");

  if (isPublicRoute) {
    return NextResponse.next();
  }

  /**
   * 5. PROTECTED ROUTES (Dashboard / Admin)
   */
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/v1).*)",
  ],
};
