import { NextRequest } from "next/server";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { Redis } from "@upstash/redis";

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Mapping of Razorpay subscription statuses to local states and plan enforcement.
 */
const STATUS_MAP: Record<string, { status: string; plan: "HOBBY" | "PRO" | "AGENCY" | null }> = {
  "subscription.authenticated": { status: "authenticated", plan: null },
  "subscription.activated": { status: "active", plan: "PRO" }, // Default to PRO, logic below refines
  "subscription.charged": { status: "active", plan: "PRO" },
  "subscription.resumed": { status: "active", plan: "PRO" },
  "subscription.pending": { status: "pending", plan: null },
  "subscription.halted": { status: "halted", plan: "HOBBY" },
  "subscription.cancelled": { status: "cancelled", plan: "HOBBY" },
  "subscription.expired": { status: "expired", plan: "HOBBY" },
  "subscription.paused": { status: "paused", plan: "HOBBY" },
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  // 1. Verify Signature
  const isValid = validateWebhookSignature(body, signature, WEBHOOK_SECRET);
  if (!isValid) {
    logger.error("Invalid Razorpay webhook signature");
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(body);
  const { event: eventName, payload, created_at: eventTimestamp } = event;
  const eventId = event.id || `evt_${crypto.randomUUID()}`;
  const eventDate = new Date(eventTimestamp * 1000);

  // 2. Replay Protection (Idempotency)
  const lockKey = `webhook:razorpay:${eventId}`;
  const isNew = await redis.set(lockKey, "processing", { nx: true, ex: 86400 });
  
  if (!isNew) {
    logger.warn(`Duplicate Razorpay Webhook received: ${eventId}`);
    return new Response("Accepted (Duplicate)", { status: 200 });
  }

  logger.info(`Razorpay Webhook: ${eventName}`, { 
    eventId,
    subscriptionId: payload?.subscription?.entity?.id 
  });

  try {
    const sub = payload.subscription.entity;
    const subscriptionId = sub.id;
    const workspaceId = sub.notes?.workspaceId;

    if (!workspaceId) {
      logger.error("No workspaceId in Razorpay subscription notes", { subscriptionId, eventId });
      return new Response("OK (No workspaceId)", { status: 200 });
    }

    // 3. Event Sequencing & State Machine
    const customer = await prisma.razorpayCustomer.findUnique({
      where: { subscriptionId },
    });

    if (customer?.lastEventAt && customer.lastEventAt >= eventDate) {
      logger.warn("Out-of-order Razorpay event ignored", { 
        subscriptionId, 
        eventId, 
        current: customer.lastEventAt, 
        received: eventDate 
      });
      return new Response("OK (Out of order)", { status: 200 });
    }

    const config = STATUS_MAP[eventName];
    if (!config) {
        logger.warn(`Unhandled Razorpay event: ${eventName}`, { eventId });
        return new Response("OK (Unhandled)", { status: 200 });
    }

    // 4. Update Database
    await prisma.$transaction(async (tx) => {
      // Update Customer Record
      await tx.razorpayCustomer.update({
        where: { subscriptionId },
        data: {
          subscriptionStatus: config.status,
          currentPeriodEnd: sub.current_end ? new Date(sub.current_end * 1000) : undefined,
          lastEventAt: eventDate,
        },
      });

      // Update Workspace Plan if applicable
      if (config.plan) {
        let finalPlan = config.plan;
        
        // Refine PRO vs AGENCY if status is active
        if (config.status === "active") {
          if (sub.plan_id === process.env.RAZORPAY_AGENCY_MONTHLY_PLAN_ID || 
              sub.plan_id === process.env.RAZORPAY_AGENCY_ANNUAL_PLAN_ID) {
            finalPlan = "AGENCY";
          }
        }

        await tx.workspace.update({
          where: { id: workspaceId },
          data: { plan: finalPlan },
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            workspaceId,
            action: "PLAN_CHANGED",
            resourceType: "BILLING",
            resourceId: subscriptionId,
            after: { plan: finalPlan, status: config.status, event: eventName },
            ip: req.headers.get("x-forwarded-for") || "internal",
          },
        });
      }
    });

    // 5. Force UI Refresh
    revalidatePath("/dashboard", "layout");

    return new Response("OK", { status: 200 });
  } catch (err) {
    await redis.del(lockKey);
    logger.error("Razorpay Webhook Processing Error", { error: String(err), eventId });
    return new Response("Webhook Error", { status: 500 });
  }
}

import { revalidatePath } from "next/cache";
