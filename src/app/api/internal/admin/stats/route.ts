import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { apiError } from "@/types/api";

export async function GET() {
  try {
    await requireAdmin();

    const [
      totalUsers,
      totalWorkspaces,
      activeSubscriptions,
      pendingWaitlist,
      failedWebhooks,
      recentAuditLogs
    ] = await Promise.all([
      prisma.user.count(),
      prisma.workspace.count(),
      prisma.razorpayCustomer.count({
        where: { subscriptionStatus: "active" }
      }),
      prisma.waitlistEntry.count({
        where: { status: "PENDING" }
      }),
      prisma.webhookDelivery.count({
        where: { success: false }
      }),
      prisma.auditLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalWorkspaces,
        activeSubscriptions,
        pendingWaitlist,
        failedWebhooks,
        recentAuditLogs,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return apiError("INTERNAL_ERROR", "Failed to fetch platform stats");
  }
}
