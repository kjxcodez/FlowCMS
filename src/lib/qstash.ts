import { Client, Receiver } from "@upstash/qstash";
import { logger } from "./logger";

if (!process.env.QSTASH_TOKEN) {
  logger.warn("QSTASH_TOKEN is missing. Background jobs will fail.");
}

export const qstash = new Client({
  token: process.env.QSTASH_TOKEN || "",
});

export const qstashReceiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || "",
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || "",
});

interface QueueWebhookOptions {
  webhookId: string;
  url: string;
  event: string;
  payload: unknown;
  secret: string;
}

export async function queueWebhook({
  webhookId,
  url,
  event,
  payload,
  secret: _secret, // prefixed with _ to avoid unused var warning until signing is implemented
}: QueueWebhookOptions) {
  try {
    // We send the webhook request THROUGH QStash to the destination URL
    // QStash handles retries if the destination returns non-2xx
    return await qstash.publishJSON({
      url,
      body: {
        event,
        payload,
        timestamp: new Date().toISOString(),
      },
      headers: {
        "X-Flow-Webhook-Id": webhookId,
      },
      retries: 3,
      callback: `${process.env.NEXT_PUBLIC_APP_URL}/api/internal/webhooks/qstash-callback`,
    });
  } catch (err) {
    logger.error("Failed to queue webhook via QStash", { error: String(err), webhookId });
    throw err;
  }
}
