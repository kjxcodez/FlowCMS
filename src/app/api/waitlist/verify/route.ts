import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!token) {
    return NextResponse.redirect(new URL("/?verified=false", baseUrl));
  }

  const entry = await prisma.waitlistEntry.findFirst({
    where: { inviteToken: token, status: "PENDING" },
  });

  if (!entry) {
    // Check if already confirmed
    const alreadyConfirmed = await prisma.waitlistEntry.findFirst({
        where: { inviteToken: token, status: { in: ["CONFIRMED", "APPROVED", "INVITED", "JOINED"] } }
    });
    
    if (alreadyConfirmed) {
        return NextResponse.redirect(new URL("/?verified=already", baseUrl));
    }

    return NextResponse.redirect(new URL("/?verified=invalid", baseUrl));
  }

  await prisma.waitlistEntry.update({
    where: { id: entry.id },
    data: { 
        confirmed: true, 
        confirmedAt: new Date(), 
        status: "CONFIRMED" 
    },
  });

  return NextResponse.redirect(new URL("/?verified=true", baseUrl));
}
