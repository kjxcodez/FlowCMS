import { prisma } from "./prisma";
import { queueWebhook } from "./qstash";
import { logger } from "./logger";

export async function dispatchWebhooks(workspaceId: string, event: string, payload: unknown) {
  try {
    const activeWebhooks = await prisma.webhook.findMany({
      where: {
        workspaceId,
        enabled: true,
        events: { has: event as any }, // eslint-disable-line @typescript-eslint/no-explicit-any
      },
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
