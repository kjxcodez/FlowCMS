"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { revalidatePath } from "next/cache";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function syncSubscription(subscriptionId: string) {
  await requireAdmin();

  try {
    const sub = await razorpay.subscriptions.fetch(subscriptionId);
    const workspaceId = (sub as any).notes?.workspaceId;

    if (!workspaceId) throw new Error("No workspaceId in subscription notes");

    // Update DB
    await prisma.$transaction(async (tx) => {
      await tx.razorpayCustomer.update({
        where: { subscriptionId },
        data: {
          subscriptionStatus: sub.status,
          currentPeriodEnd: sub.current_end ? new Date(sub.current_end * 1000) : undefined,
          lastEventAt: new Date(), // Manual override sets new baseline
        },
      });

      let plan: "PRO" | "AGENCY" | "HOBBY" = "PRO";
      if (sub.status !== "active") {
        plan = "HOBBY";
      } else if (
        sub.plan_id === process.env.RAZORPAY_AGENCY_MONTHLY_PLAN_ID || 
        sub.plan_id === process.env.RAZORPAY_AGENCY_ANNUAL_PLAN_ID
      ) {
        plan = "AGENCY";
      }

      await tx.workspace.update({
        where: { id: workspaceId },
        data: { plan },
      });
    });

    revalidatePath("/admin/operations");
    revalidatePath("/dashboard", "layout");

    return { success: true };
  } catch (err) {
    console.error("Manual sync failed", err);
    throw new Error("Failed to sync subscription");
  }
}
