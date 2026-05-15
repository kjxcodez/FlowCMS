import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { COLLECTION_TEMPLATES } from "@/config/templates/collections";
import { logAction } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const { workspace, session, role } = await requireWorkspace();

    if (role !== "OWNER" && role !== "ADMIN") {
      return apiError("FORBIDDEN", "Only owners and admins can apply templates.");
    }

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
    console.error("[APPLY_TEMPLATE_ERROR]", err);
    return apiError("INTERNAL_ERROR", "Failed to apply collection template.");
  }
}
