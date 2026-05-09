import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!token) {
    return NextResponse.redirect(new URL("/", baseUrl));
  }

  const entry = await prisma.waitlistEntry.findUnique({
    where: { inviteToken: token },
  });

  if (!entry || entry.status !== "INVITED") {
    return NextResponse.redirect(new URL("/?invite=invalid", baseUrl));
  }

  if (entry.inviteExpiresAt && entry.inviteExpiresAt < new Date()) {
    return NextResponse.redirect(new URL("/?invite=expired", baseUrl));
  }

  // Redirect to signup with token so middleware and signup page allow it
  return NextResponse.redirect(
    new URL(`/register?invite=${token}&email=${encodeURIComponent(entry.email)}`, baseUrl)
  );
}
