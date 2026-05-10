import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { razorpay, RAZORPAY_PLANS, PlanKey } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { FEATURES } from "@/lib/launch";

export async function POST(req: NextRequest) {
  if (!FEATURES.enableBilling) return apiError("FORBIDDEN", "This feature is not available yet.");
  
  try {
    const { workspace, session } = await requireWorkspace();
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
  } catch (err) {
    console.error("[RAZORPAY_CHECKOUT_ERROR]", err);
    return apiError("INTERNAL_ERROR", "Failed to initialize subscription checkout.");
  }
}
