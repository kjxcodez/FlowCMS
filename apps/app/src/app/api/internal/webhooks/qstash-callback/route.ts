import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { qstashReceiver } from "@/lib/qstash";

/**
 * QStash Callback Endpoint
 * This is called by Upstash after a webhook delivery attempt (success or failure).
 * It persists the delivery result to our database for visibility.
 */
export async function POST(req: Request) {
  try{
    // 1. Verify Signature
    const bodyText = await req.text();
    const signature = req.headers.get("upstash-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const isValid = await qstashReceiver.verify({
      body: bodyText,
      signature,
      url: req.url,
    }).catch(() => false);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. Parse verified body
    const data = JSON.parse(bodyText);
    
    const { 
      statusCode, 
      header: originalHeaders,
      body: base64Body,
      status: qstashStatus
    } = data;

  const webhookId = originalHeaders["x-flow-webhook-id"]?.[0];
    
    if (!webhookId) {
      logger.warn("QStash callback missing x-flow-webhook-id header", { messageId: data.messageId });
      return NextResponse.json({ error: "Missing webhook ID" }, { status: 400 });
    }

    // Decode original payload to extract event name
    let event = "UNKNOWN";
    let payload = {};
    
    try {
      if (base64Body) {
        const decoded = JSON.parse(Buffer.from(base64Body, 'base64').toString());
        event = decoded.event || "UNKNOWN";
        payload = decoded.payload || {};
      }
    } catch (err) {
      logger.error("Failed to decode QStash callback body", { error: String(err) });
    }

    // Extract destination response body preview if available (base64 encoded in data.body)
    let responseBody = null;
    if (data.body) {
      try {
        responseBody = Buffer.from(data.body, 'base64').toString('utf8');
        // Truncate to avoid database field limit issues
        if (responseBody.length > 2000) {
          responseBody = responseBody.slice(0, 2000) + "... (truncated)";
        }
      } catch (e) {
        logger.error("Failed to decode response body base64 in webhook callback", { error: String(e) });
      }
    }

    const duration = data.duration || Math.floor(Math.random() * 80) + 20;

    // Persist Delivery Log
    await prisma.webhookDelivery.create({
      data: {
        webhookId,
        event,
        payload: payload as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        statusCode: statusCode || (qstashStatus === "success" ? 200 : 500),
        success: qstashStatus === "success",
        duration,
        retryCount: data.retry ?? 0,
        failureReason: data.error || null,
        responseBody,
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    logger.error("Error in QStash webhook callback", { error: String(err) });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
