import { NextRequest } from "next/server";
import { requireWorkspace, requireRole, ForbiddenError } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { COLLECTION_TEMPLATES } from "@/config/templates/collections";
import { logAction } from "@/lib/audit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  let workspace;
  try {
    const sessionRes = await requireWorkspace();
    workspace = sessionRes.workspace;
    const { session, role } = sessionRes;

    await requireRole(role, "ADMIN");

    const { templateId } = await req.json();
    const template = COLLECTION_TEMPLATES.find((t) => t.id === templateId);

    if (!template) {
      return apiError("NOT_FOUND", "Template not found.");
    }

    // Generate unique slug if collision exists
    let slug = template.slug;
    const existing = await prisma.collection.findFirst({
      where: { workspaceId: workspace.id, slug: template.slug },
    });

    if (existing) {
      slug = `${template.slug}-${Math.floor(Math.random() * 1000)}`;
    }

    const collection = await prisma.collection.create({
      data: {
        workspaceId: workspace.id,
        name: template.name,
        slug,
        description: template.description,
        fields: template.fields as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      },
    });

    // Audit Log
    logAction({
      workspaceId: workspace.id,
      userId: session.user.id,
      action: "CREATE",
      resourceType: "COLLECTION",
      resourceId: collection.id,
      resourceName: collection.name,
      after: { templateId },
    });

    return apiSuccess(collection);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    logger.error("Applying template failed", {
      error: err,
      workspaceId: typeof workspace !== "undefined" ? workspace.id : undefined,
    });
    return apiError("INTERNAL_ERROR", "Failed to apply collection template.");
  }
}
