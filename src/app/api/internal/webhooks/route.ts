import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { PLAN_LIMITS } from "@/types/cms";
import { CreateWebhookSchema } from "@/lib/validations/webhook";
import crypto from "crypto";
import { logAction } from "@/lib/audit";
import { canAccessFeature } from "@/lib/launch";
import { isAdminEmail } from "@/lib/admin";

export async function GET() {
  const { workspace, session } = await requireWorkspace();
  if (!canAccessFeature("enableWebhooks", session.user.email)) {
    return apiError("FORBIDDEN", "This feature is not available yet.");
  }
  
  const webhooks = await prisma.webhook.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
  });
  return apiSuccess(webhooks);
}

export async function POST(req: NextRequest) {
  const { workspace, session } = await requireWorkspace();

  if (!canAccessFeature("enableWebhooks", session.user.email)) {
    return apiError("FORBIDDEN", "This feature is not available yet.");
  }

  const isPlatformAdmin = isAdminEmail(session.user.email);
  if (!isPlatformAdmin && !PLAN_LIMITS[workspace.plan]?.webhooks) {
    // For Early Access Beta, allow Hobby tier users to create at least 1 active webhook
    const existingWebhooksCount = await prisma.webhook.count({
      where: { workspaceId: workspace.id },
    });
    if (existingWebhooksCount >= 1) {
      return apiError(
        "PLAN_LIMIT_REACHED",
        "Hobby plan is limited to 1 active webhook. Please upgrade to Pro for unlimited endpoints."
      );
    }
  }

  const body = await req.json();
  const parsed = CreateWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_INPUT", parsed.error.issues[0].message);
  }

  const webhook = await prisma.webhook.create({
    data: {
      workspaceId: workspace.id,
      url: parsed.data.url,
      events: parsed.data.events as never[],
      secret: crypto.randomBytes(32).toString("hex"),
    },
  });

  logAction({
    workspaceId: workspace.id,
    userId: session.user.id,
    action: "WEBHOOK_CREATED",
    resourceType: "WEBHOOK",
    resourceId: webhook.id,
    resourceName: webhook.url,
  });

  return apiSuccess(webhook);
}

export async function DELETE(req: NextRequest) {
  const { workspace, session } = await requireWorkspace();
  
  if (!canAccessFeature("enableWebhooks", session.user.email)) {
    return apiError("FORBIDDEN", "This feature is not available yet.");
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return apiError("INVALID_INPUT", "Webhook ID required.");

  const result = await prisma.webhook.deleteMany({
    where: { id, workspaceId: workspace.id },
  });
  if (!result.count) return apiError("NOT_FOUND", "Webhook not found.");

  logAction({
    workspaceId: workspace.id,
    userId: session.user.id,
    action: "WEBHOOK_DELETED",
    resourceType: "WEBHOOK",
    resourceId: id,
  });

  return apiSuccess({ deleted: true });
}
