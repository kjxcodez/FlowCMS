import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * QStash Callback Endpoint
 * This is called by Upstash after a webhook delivery attempt (success or failure).
 * It persists the delivery result to our database for visibility.
 */
export async function POST(req: Request) {
  try {
    // QStash Callback Request Body Structure:
    // {
    //   "messageId": "msg_...",
    //   "url": "https://customer-site.com/webhook",
    //   "status": "success" | "failed",
    //   "statusCode": 200,
    //   "body": "...", (base64 encoded original body)
    //   "header": { "x-flow-webhook-id": ["..."], ... }
    // }
    const data = await req.json();
    
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

    // Persist Delivery Log
    await prisma.webhookDelivery.create({
      data: {
        webhookId,
        event,
        payload: payload as any,
        statusCode: statusCode || (qstashStatus === "success" ? 200 : 500),
        success: qstashStatus === "success",
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Error in QStash webhook callback", { error: String(err) });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
