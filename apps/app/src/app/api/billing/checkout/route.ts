import { NextRequest } from "next/server";
import { requireWorkspace, requireRole, ForbiddenError } from "@/lib/session";
import { razorpay, RAZORPAY_PLANS, PlanKey } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { logger } from "@/lib/logger";
import { FEATURES } from "@/lib/launch";

export async function POST(req: NextRequest) {
  if (!FEATURES.enableBilling) return apiError("FORBIDDEN", "This feature is not available yet.");
  
  let workspace;
  try {
    const sessionRes = await requireWorkspace();
    workspace = sessionRes.workspace;
    const { session, role } = sessionRes;
    await requireRole(role, "OWNER");

    const body = await req.json();
    const planKey = body.planKey as PlanKey;

    if (!RAZORPAY_PLANS[planKey]) {
      return apiError("INVALID_INPUT", "Invalid plan selected.");
    }

    const planId = RAZORPAY_PLANS[planKey];

    // 1. Get or create Razorpay Customer record
    let customerRecord = await prisma.razorpayCustomer.findUnique({
      where: { workspaceId: workspace.id },
    });

    if (!customerRecord) {
      customerRecord = await prisma.razorpayCustomer.create({
        data: { workspaceId: workspace.id },
      });
    }

    // 1.1 Dual-State Validation: Verify remote Razorpay state if we have a local ID
    if (customerRecord.subscriptionId) {
      try {
        const remoteSub = await razorpay.subscriptions.fetch(customerRecord.subscriptionId);
        
        // Active/Authenticated = Definitely subscribed
        // Created = Already has a pending checkout session
        const isBlocked = ["active", "authenticated", "created"].includes(remoteSub.status);

        // Auto-repair local state if mismatch found
        if (remoteSub.status !== customerRecord.subscriptionStatus) {
          await prisma.razorpayCustomer.update({
            where: { workspaceId: workspace.id },
            data: { subscriptionStatus: remoteSub.status }
          });
        }

        if (isBlocked) {
          return apiError(
            "ALREADY_SUBSCRIBED", 
            `Workspace already has a ${remoteSub.status} subscription. Please manage it in Settings.`
          );
        }
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        // If not found in Razorpay, we can proceed with a new one
        if (err.statusCode !== 404) {
          logger.error("Razorpay signature verification error occurred", { error: err, workspaceId: workspace.id });
          return apiError("INTERNAL_ERROR", "Could not verify subscription status.");
        }
      }
    }

    // 2. Create subscription in Razorpay
    // Note: total_count is set to a high number for ongoing subscriptions
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 120, // 120 months = 10 years
      quantity: 1,
      notes: {
        workspaceId: workspace.id,
      },
    });

    // 3. Save subscription details to DB
    await prisma.razorpayCustomer.update({
      where: { workspaceId: workspace.id },
      data: {
        subscriptionId: subscription.id,
        planId: planId,
        subscriptionStatus: "created",
      },
    });

    return apiSuccess({
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      workspaceName: workspace.name,
      userEmail: session.user.email,
      userName: session.user.name,
    });
  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    logger.error("Razorpay checkout initialization failure", { error: err, workspaceId: typeof workspace !== "undefined" ? workspace.id : undefined });
    return apiError("INTERNAL_ERROR", "Failed to initialize subscription checkout.");
  }
}
