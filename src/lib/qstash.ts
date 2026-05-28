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

import crypto from "crypto";

export async function queueWebhook({
  webhookId,
  url,
  event,
  payload,
  secret,
}: QueueWebhookOptions) {
  try {
    const timestamp = new Date().toISOString();
    const bodyObj = {
      event,
      payload,
      timestamp,
    };
    
    // Cryptographically sign the webhook ID, timestamp, and body
    const rawBody = JSON.stringify(bodyObj);
    const hmacInput = `${webhookId}:${timestamp}:${rawBody}`;
    const signature = crypto
      .createHmac("sha256", secret)
      .update(hmacInput)
      .digest("hex");

    // We send the webhook request THROUGH QStash to the destination URL
    // QStash handles retries if the destination returns non-2xx
    return await qstash.publishJSON({
      url,
      body: bodyObj,
      headers: {
        "X-Flow-Webhook-Id": webhookId,
        "X-Flow-Signature": signature,
        "X-Flow-Timestamp": timestamp,
      },
      retries: 3,
      callback: `${process.env.NEXT_PUBLIC_APP_URL}/api/internal/webhooks/qstash-callback`,
    });
  } catch (err) {
    logger.error("Failed to queue webhook via QStash", { error: String(err), webhookId });
    throw err;
  }
}
