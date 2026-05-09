import { NextRequest } from "next/server";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;

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
  const { event: eventName, payload } = event;

  logger.info(`Razorpay Webhook: ${eventName}`, { subscriptionId: payload.subscription.entity.id });

  try {
    switch (eventName) {
      case "subscription.activated":
      case "subscription.charged":
      case "subscription.resumed": {
        const sub = payload.subscription.entity;
        const workspaceId = sub.notes?.workspaceId;

        if (!workspaceId) {
          logger.error("No workspaceId in Razorpay subscription notes");
          break;
        }

        // Update Subscription Record
        await prisma.razorpayCustomer.update({
          where: { subscriptionId: sub.id },
          data: {
            subscriptionStatus: "active",
            currentPeriodEnd: new Date(sub.current_end * 1000),
          },
        });

        // Update Workspace Plan
        // Map planId back to Plan enum
        let plan: "PRO" | "AGENCY" = "PRO";
        if (sub.plan_id === process.env.RAZORPAY_AGENCY_MONTHLY_PLAN_ID || 
            sub.plan_id === process.env.RAZORPAY_AGENCY_ANNUAL_PLAN_ID) {
          plan = "AGENCY";
        }

        await prisma.workspace.update({
          where: { id: workspaceId },
          data: { plan },
        });
        break;
      }

      case "subscription.cancelled":
      case "subscription.expired": {
        const sub = payload.subscription.entity;
        const workspaceId = sub.notes?.workspaceId;

        await prisma.razorpayCustomer.update({
          where: { subscriptionId: sub.id },
          data: {
            subscriptionStatus: eventName === "subscription.cancelled" ? "cancelled" : "expired",
          },
        });

        if (workspaceId) {
          await prisma.workspace.update({
            where: { id: workspaceId },
            data: { plan: "HOBBY" },
          });
        }
        break;
      }

      case "subscription.paused": {
        const sub = payload.subscription.entity;
        await prisma.razorpayCustomer.update({
          where: { subscriptionId: sub.id },
          data: { subscriptionStatus: "paused" },
        });
        break;
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    logger.error("Razorpay Webhook Processing Error", { error: String(err) });
    return new Response("Webhook Error", { status: 500 });
  }
}
