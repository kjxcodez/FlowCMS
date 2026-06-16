import { NextRequest } from "next/server";
import { requireWorkspace, requireRole, ForbiddenError } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ envId: string }> }
) {
  try {
    const { envId } = await params;
    const { workspace, session, role } = await requireWorkspace();
    await requireRole(role, "OWNER");

    const env = await prisma.environment.findFirst({
      where: { id: envId, workspaceId: workspace.id }
    });

    if (!env) {
      return apiError("NOT_FOUND", "Environment not found.");
    }

    // CRITICAL PROTECTION: Never allow deleting the default/production environment
    if (env.isDefault || env.slug === "production") {
      return apiError("INVALID_ACTION", "The Production environment is protected and cannot be deleted.");
    }

    // Check if entries exist in this environment
    const entryCount = await prisma.entry.count({
      where: { environmentId: env.id }
    });

    if (entryCount > 0) {
      return apiError("INVALID_ACTION", `Cannot delete environment containing ${entryCount} entries. Delete content first.`);
    }

    await prisma.environment.delete({
      where: { id: env.id }
    });

    await prisma.auditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: session.user.id,
        action: "DELETE",
        resourceType: "ENVIRONMENT",
        resourceId: env.id,
        resourceName: env.name
      }
    });

    return apiSuccess({ ok: true });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    console.error("Environment delete error:", err);
    return apiError("INTERNAL_ERROR", "Failed to delete environment.");
  }
}
