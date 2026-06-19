import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { PLAN_LIMITS } from "@/types/cms";
import { emitPlatformEvent, PLATFORM_EVENTS } from "../events/emitter";

import { WebhookEvent } from "@/generated/prisma";

export class WebhookService {
  /**
   * List all webhook endpoints registered for a workspace.
   */
  static async listWebhooks(workspaceId: string) {
    return await prisma.webhook.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Register a new webhook endpoint with validation constraints.
   */
  static async createWebhook(
    workspaceId: string,
    url: string,
    events: WebhookEvent[],
    userId: string,
    plan: "HOBBY" | "PRO" | "AGENCY" | "ENTERPRISE",
    isPlatformAdmin: boolean
  ) {
    if (!isPlatformAdmin && !PLAN_LIMITS[plan]?.webhooks) {
      throw new Error(
        "FEATURE_NOT_AVAILABLE: Webhooks are not available on your current plan."
      );
    }

    const webhook = await prisma.webhook.create({
      data: {
        workspaceId,
        url,
        events,
        secret: crypto.randomBytes(32).toString("hex"),
      },
    });

    emitPlatformEvent(PLATFORM_EVENTS.WEBHOOK_CREATED, {
      workspaceId,
      userId,
      webhookId: webhook.id,
      webhookUrl: webhook.url,
    });

    return webhook;
  }

  /**
   * Revoke an active webhook callback endpoint.
   */
  static async deleteWebhook(workspaceId: string, id: string, userId: string) {
    const result = await prisma.webhook.deleteMany({
      where: { id, workspaceId },
    });
    if (!result.count) {
      throw new Error("NOT_FOUND: Webhook not found.");
    }

    emitPlatformEvent(PLATFORM_EVENTS.WEBHOOK_DELETED, {
      workspaceId,
      userId,
      webhookId: id,
    });

    return { deleted: true };
  }

  /**
   * List recent delivery fire logs for a registered webhook.
   */
  static async listDeliveries(webhookId: string, limit = 20) {
    return await prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
