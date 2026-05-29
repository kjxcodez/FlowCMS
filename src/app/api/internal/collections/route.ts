import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { checkCollectionLimit } from "@/lib/usage";
import { apiError, apiSuccess } from "@/types/api";
import { logger } from "@/lib/logger";
import { CreateCollectionSchema } from "@/lib/validations/collection";

import { isAdminEmail } from "@/lib/admin";

import { dispatchWebhooks } from "@/lib/webhooks";

import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { workspace } = await requireWorkspace();
    const collections = await prisma.collection.findMany({
      where: { workspaceId: workspace.id },
      include: { _count: { select: { entries: true } } },
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess(collections);
  } catch (error) {
    Sentry.captureException(error);
    return apiError("INTERNAL_ERROR", "Failed to fetch collections");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workspace, session } = await requireWorkspace();

    const limit = await checkCollectionLimit(
      workspace.id,
      workspace.plan,
      isAdminEmail(session.user.email)
    );
    if (!limit.allowed) {
      return apiError(
        "PLAN_LIMIT_REACHED",
        `${workspace.plan} plan allows ${limit.limit} collections.`
      );
    }

    const body = await req.json();
    const parsed = CreateCollectionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", parsed.error.issues[0].message);
    }

    const existing = await prisma.collection.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId: workspace.id,
          slug: parsed.data.slug,
        },
      },
    });
    if (existing) {
      return apiError(
        "INVALID_INPUT",
        `Slug "${parsed.data.slug}" already in use.`
      );
    }

    const collection = await prisma.collection.create({
      data: { workspaceId: workspace.id, ...parsed.data },
    });

    logger.info("Collection created", {
      workspaceId: workspace.id,
      slug: parsed.data.slug,
    });

    // Dispatch Outbound Webhook
    dispatchWebhooks(workspace.id, "COLLECTION_CREATED", collection);

    return apiSuccess(collection);
  } catch (error) {
    Sentry.captureException(error);
    return apiError("INTERNAL_ERROR", "Failed to create collection");
  }
}
