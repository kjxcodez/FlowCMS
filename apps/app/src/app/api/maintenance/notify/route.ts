import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body || {};

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Log & optionally save email record
    try {
      if (prisma && prisma.emailLog) {
        await prisma.emailLog.create({
          data: {
            to: normalizedEmail,
            template: "MAINTENANCE_NOTIFY",
            eventType: "SYSTEM_RESTORATION_ALERT",
            status: "PENDING",
            idempotencyKey: `maint_notify_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          },
        });
      }
    } catch (dbErr) {
      console.warn("[MAINTENANCE_NOTIFY] Could not record in database:", dbErr);
    }

    console.log(`[MAINTENANCE_NOTIFY] Email registered: ${normalizedEmail}`);

    return NextResponse.json(
      {
        success: true,
        message: "Your email has been registered for system restoration alerts.",
        email: normalizedEmail,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[MAINTENANCE_NOTIFY_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Unable to process notification request." },
      { status: 500 }
    );
  }
}
