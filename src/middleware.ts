import { NextRequest, NextResponse } from "next/server";

/**
 * Edge-compatible middleware.
 * Does NOT import Prisma or Better Auth server libs (they require Node runtime).
 * Auth check is cookie-based; server routes verify the session properly.
 */
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const launchMode = process.env.NEXT_PUBLIC_LAUNCH_MODE || "waitlist";

  // 1. Static/Internal paths - skip
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/public") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. LAUNCH_MODE Gating
  if (launchMode === "waitlist" || launchMode === "early_access") {
    // Only allow /register/[provider] and /signup if they are following the flow
    if (pathname === "/signup" || pathname.startsWith("/register/")) {
      const pendingInvite = request.cookies.get("pending_invite")?.value;
      const hasTokenInUrl = searchParams.has("invite");

      // If hitting /register/[provider] without token, block
      if (pathname.startsWith("/register/") && !hasTokenInUrl) {
        return NextResponse.redirect(new URL("/auth/error?code=INVITE_REQUIRED", request.url));
      }

      // If hitting /signup without the handoff cookie, block
      if (pathname === "/signup" && !pendingInvite) {
        return NextResponse.redirect(new URL("/auth/error?code=INVITE_REQUIRED", request.url));
      }
    }
  }

  // 3. Public routes
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/auth/error" ||
    pathname.startsWith("/register/") ||
    pathname === "/signup" ||
    pathname.startsWith("/api/waitlist") ||
    pathname.startsWith("/api/v1")
  ) {
    return NextResponse.next();
  }

  // 4. Protected routes
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Real-time status check could be added here if we use a session cache in Redis
  // But for now, sessionToken presence is the baseline.

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/v1).*)",
  ],
};
