import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signInvitePayload } from "@/lib/tokens";

export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("invite");
  const email = searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(new URL("/auth/error?code=INVITE_MISSING", req.url));
  }

  // ADMIN BYPASS: Founders skip all gating
  const adminEmails = (process.env.ADMIN_BYPASS_EMAILS ?? "").split(",").map(e => e.trim());
  const isAdmin = adminEmails.includes(email);

  if (!isAdmin) {
    const entry = await prisma.waitlistEntry.findUnique({
      where: { inviteToken: token },
    });

    // Security: Token must match email and status must be EXACTLY INVITED
    if (!entry || entry.email !== email || entry.status !== "INVITED") {
      return NextResponse.redirect(new URL("/auth/error?code=INVITE_INVALID", req.url));
    }

    // Expiry check
    if (entry.inviteExpiresAt && entry.inviteExpiresAt < new Date()) {
      return NextResponse.redirect(new URL("/auth/error?code=INVITE_EXPIRED", req.url));
    }
  }

  // Set secure handoff cookie (Checkpoint 1)
  const cookieStore = await cookies();
  const cookieValue = signInvitePayload({ token, email, ts: Date.now() });
  
  cookieStore.set("pending_invite", cookieValue, {
    httpOnly: true,
    secure: true, // Always secure for signed handoff
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  // Handoff to Better Auth or Signup UI
  if (provider === "google") {
    // Redirect to Better Auth social sign-in entry point
    return NextResponse.redirect(new URL("/api/auth/login/social/google", req.url));
  }

  // For credentials, redirect to /signup with pre-filled email
  return NextResponse.redirect(new URL(`/signup?email=${encodeURIComponent(email)}`, req.url));
}
