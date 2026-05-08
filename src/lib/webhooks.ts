import crypto from "crypto";
import { prisma } from "./prisma";
import { logger } from "./logger";

export async function fireWebhooks(
  workspaceId: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  const webhooks = await prisma.webhook.findMany({
    where: {
      workspaceId,
      enabled: true,
      events: { has: event as never },
    },
  });

  if (!webhooks.length) return;

  const body = JSON.stringify({
    event,
    payload,
    timestamp: new Date().toISOString(),
  });

  await Promise.allSettled(
    webhooks.map(async (wh) => {
      const sig = crypto
        .createHmac("sha256", wh.secret)
        .update(body)
        .digest("hex");

      const start = Date.now();
      let statusCode: number | null = null;
      let success = false;

      try {
        const res = await fetch(wh.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-FlowCMS-Signature": `sha256=${sig}`,
            "X-FlowCMS-Event": event,
          },
          body,
          signal: AbortSignal.timeout(10_000),
        });
        statusCode = res.status;
        success = res.ok;
      } catch (err) {
        logger.warn("Webhook delivery failed", {
          webhookId: wh.id,
          event,
          error: String(err),
        });
      }

      await prisma.webhookDelivery.create({
        data: {
          webhookId: wh.id,
          event,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload: { event, payload } as any,
          statusCode,
          success,
          duration: Date.now() - start,
        },
      });
    })
  );
}
