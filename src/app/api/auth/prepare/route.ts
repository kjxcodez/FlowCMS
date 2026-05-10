import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signInvitePayload } from "@/lib/tokens";

export async function POST(req: Request) {
  try {
    const { token, email } = await req.json();

    if (!token || !email) {
      return NextResponse.json({ error: "Missing token or email" }, { status: 400 });
    }

    // Verify invite exists and is for this email
    const entry = await prisma.waitlistEntry.findUnique({
      where: { inviteToken: token },
    });

    if (!entry || entry.email !== email || entry.status !== "INVITED") {
      return NextResponse.json({ error: "Invalid or consumed invite" }, { status: 400 });
    }

    if (entry.inviteExpiresAt && entry.inviteExpiresAt < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 400 });
    }

    // Set secure handoff cookie (Checkpoint 1)
    const cookieStore = await cookies();
    const cookieValue = signInvitePayload({ token, email, ts: Date.now() });
    
    cookieStore.set("pending_invite", cookieValue, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 600, // 10 minutes
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
