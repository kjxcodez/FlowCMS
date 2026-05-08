import { NextRequest, NextResponse } from "next/server";

/**
 * Edge-compatible middleware.
 * Does NOT import Prisma or Better Auth server libs (they require Node runtime).
 * Auth check is cookie-based; server routes verify the session properly.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — skip auth check entirely
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/v1") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // For protected routes, check for Better Auth session cookie.
  // The actual session is validated server-side by the API routes.
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value;

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
