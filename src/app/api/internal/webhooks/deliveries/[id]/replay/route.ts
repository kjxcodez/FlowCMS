import { NextRequest } from "next/server";
import { requireWorkspace, requireRole, ForbiddenError } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { queueWebhook } from "@/lib/qstash";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspace, role } = await requireWorkspace();
    await requireRole(role, "ADMIN");
    const { id } = await params;

    // 1. Fetch the delivery record
    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id },
      include: {
        webhook: true,
      },
    });

    if (!delivery) {
      return apiError("NOT_FOUND", "Webhook delivery log not found.");
    }

    // 2. Verify that this webhook belongs to the user's active workspace
    if (delivery.webhook.workspaceId !== workspace.id) {
      return apiError("FORBIDDEN", "Access denied.");
    }

    // 3. Queue the webhook again with the exact same payload
    await queueWebhook({
      webhookId: delivery.webhookId,
      url: delivery.webhook.url,
      event: delivery.event,
      payload: delivery.payload,
      secret: delivery.webhook.secret,
    });

    return apiSuccess({ message: "Webhook successfully re-queued for delivery." });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    console.error("Manual webhook replay exception:", err);
    return apiError("INTERNAL_ERROR", "Failed to replay webhook delivery.");
  }
}
