import { requireWorkspace, requireRole, ForbiddenError } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/types/api";
import { logAction } from "@/lib/audit";
import { logger } from "@/lib/logger";

export async function GET() {
  const { workspace, role } = await requireWorkspace();
  return apiSuccess({ name: workspace.name, plan: workspace.plan, slug: workspace.slug, role });
}

export async function PATCH(req: Request) {
  try {
    const { workspace, role, session } = await requireWorkspace();
    await requireRole(role, "ADMIN");

    const userId = session.user.id;

    const { name } = await req.json();
    if (!name || name.length < 2) {
      return apiError("INVALID_INPUT", "Workspace name must be at least 2 characters.");
    }

    const updated = await prisma.workspace.update({
      where: { id: workspace.id },
      data: { name },
    });

    logAction({
      workspaceId: workspace.id,
      userId,
      action: "UPDATE",
      resourceType: "WORKSPACE",
      resourceId: workspace.id,
      before: { name: workspace.name },
      after: { name: updated.name },
    });

    return apiSuccess({ name: updated.name, plan: updated.plan, slug: updated.slug, role });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    return apiError("INTERNAL_ERROR", "Failed to update workspace.");
  }
}

export async function DELETE() {
  let workspace;
  let userId;
  try {
    const sessionRes = await requireWorkspace();
    workspace = sessionRes.workspace;
    const { role, session } = sessionRes;
    await requireRole(role, "OWNER");

    userId = session.user.id;

    // Cascade delete handles entries, content types, members, etc.
    await prisma.workspace.delete({
      where: { id: workspace.id },
    });

    logAction({
      workspaceId: workspace.id,
      userId,
      action: "DELETE",
      resourceType: "WORKSPACE",
      resourceId: workspace.id,
      resourceName: workspace.name,
    });

    return apiSuccess({ message: "Workspace deleted successfully" });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    logger.error("Failed to delete workspace", {
      error: err,
      workspaceId: typeof workspace !== "undefined" ? workspace.id : undefined,
      userId: typeof userId !== "undefined" ? userId : undefined,
    });
    return apiError("INTERNAL_ERROR", "Failed to delete workspace.");
  }
}
