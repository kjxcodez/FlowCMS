"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { razorpay } from "@/lib/razorpay";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

/**
 * Force sync all active subscriptions from Razorpay.
 * Used for billing recovery when webhooks are missed.
 */
export async function syncAllSubscriptions() {
  const session = await requireAdmin();

  const customers = await prisma.razorpayCustomer.findMany({
    where: { subscriptionId: { not: null } }
  });

  const results = {
    total: customers.length,
    updated: 0,
    failed: 0,
  };

  logger.info("Starting manual billing sync", { adminId: session.user.id, count: customers.length });

  for (const customer of customers) {
    try {
      const sub = await razorpay.subscriptions.fetch(customer.subscriptionId!);
      
      await prisma.razorpayCustomer.update({
        where: { id: customer.id },
        data: {
          subscriptionStatus: sub.status,
          currentPeriodEnd: sub.current_end ? new Date(sub.current_end * 1000) : null,
          planId: sub.plan_id,
          lastEventAt: new Date(),
        }
      });
      results.updated++;
    } catch (err) {
      logger.error(`Failed to sync sub ${customer.subscriptionId}`, { error: String(err) });
      results.failed++;
    }
  }

  // Audit Log the sync event
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE",
      resourceType: "SYSTEM",
      resourceId: "RAZORPAY_SYNC_ALL",
      resourceName: `Manual Sync All: ${results.updated} updated, ${results.failed} failed`
    }
  });

  revalidatePath("/admin/operations");
  return results;
}

export async function syncSubscription(subscriptionId: string) {
  const session = await requireAdmin();
  
  try {
    const sub = await razorpay.subscriptions.fetch(subscriptionId);
    
    await prisma.razorpayCustomer.updateMany({
      where: { subscriptionId },
      data: {
        subscriptionStatus: sub.status,
        currentPeriodEnd: sub.current_end ? new Date(sub.current_end * 1000) : null,
        planId: sub.plan_id,
        lastEventAt: new Date(),
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        resourceType: "BILLING",
        resourceId: subscriptionId,
        resourceName: `Manual Sync: ${subscriptionId}`
      }
    });

    revalidatePath("/admin/operations");
    return { success: true };
  } catch (err) {
    logger.error(`Failed to sync sub ${subscriptionId}`, { error: String(err) });
    throw new Error("Failed to sync subscription");
  }
}
