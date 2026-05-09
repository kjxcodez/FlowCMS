import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { CONTENT_TYPE_TEMPLATES } from "@/config/templates/content-types";
import { logAction } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const { workspace, session, role } = await requireWorkspace();

    if (role !== "OWNER" && role !== "ADMIN") {
      return apiError("FORBIDDEN", "Only owners and admins can apply templates.");
    }

    const { templateId } = await req.json();
    const template = CONTENT_TYPE_TEMPLATES.find((t) => t.id === templateId);

    if (!template) {
      return apiError("NOT_FOUND", "Template not found.");
    }

    // Generate unique slug if collision exists
    let slug = template.slug;
    const existing = await prisma.contentType.findFirst({
      where: { workspaceId: workspace.id, slug: template.slug },
    });

    if (existing) {
      slug = `${template.slug}-${Math.floor(Math.random() * 1000)}`;
    }

    const contentType = await prisma.contentType.create({
      data: {
        workspaceId: workspace.id,
        name: template.name,
        slug,
        description: template.description,
        fields: template.fields as any,
      },
    });

    // Audit Log
    logAction({
      workspaceId: workspace.id,
      userId: session.user.id,
      action: "CREATE",
      resourceType: "CONTENT_TYPE",
      resourceId: contentType.id,
      resourceName: contentType.name,
      after: { templateId },
    });

    return apiSuccess(contentType);
  } catch (err) {
    console.error("[APPLY_TEMPLATE_ERROR]", err);
    return apiError("INTERNAL_ERROR", "Failed to apply content type template.");
  }
}
