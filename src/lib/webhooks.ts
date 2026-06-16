import { WebhookEvent } from "@/generated/prisma";
import { prisma } from "./prisma";
import { queueWebhook } from "./qstash";
import { logger } from "./logger";

export async function dispatchWebhooks(
  workspaceId: string,
  event: string,
  payload: any,
  environmentId?: string
) {
  try {
    let finalEnvId = environmentId;
    if (!finalEnvId && payload && typeof payload === "object") {
      if (typeof payload.environmentId === "string") {
        finalEnvId = payload.environmentId;
      } else if (payload.entry && typeof payload.entry.environmentId === "string") {
        finalEnvId = payload.entry.environmentId;
      } else {
        const entryId = payload.entryId || payload.id;
        if (typeof entryId === "string" && (event.startsWith("ENTRY_") || event.startsWith("PAGE_"))) {
          const entry = await prisma.entry.findUnique({
            where: { id: entryId },
            select: { environmentId: true }
          });
          if (entry?.environmentId) {
            finalEnvId = entry.environmentId;
          }
        }
      }
    }

    const whereClause: any = {
      workspaceId,
      enabled: true,
      events: { has: event as WebhookEvent },
    };

    if (finalEnvId) {
      whereClause.OR = [
        { environmentId: finalEnvId },
        { environmentId: null }
      ];
    } else {
      whereClause.environmentId = null;
    }

    const activeWebhooks = await prisma.webhook.findMany({
      where: whereClause,
    });

    if (activeWebhooks.length === 0) return;

    logger.info(`Dispatching ${activeWebhooks.length} webhooks for event: ${event}`);

    const tasks = activeWebhooks.map((wh) =>
      queueWebhook({
        webhookId: wh.id,
        url: wh.url,
        event,
        payload,
        secret: wh.secret,
      }).catch((err) => {
        logger.error(`Failed to queue webhook ${wh.id}`, { error: String(err) });
      })
    );

    // Fire and forget
    Promise.all(tasks).catch((err) => {
      logger.error("Error in webhook dispatch tasks", { error: String(err) });
    });
  } catch (err) {
    logger.error("Webhook dispatch system exception", { error: String(err), workspaceId, event });
  }
}
