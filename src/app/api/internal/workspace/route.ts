import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/types/api";
import { logAction } from "@/lib/audit";

export async function GET() {
  const { workspace } = await requireWorkspace();
  return apiSuccess({ name: workspace.name, plan: workspace.plan, slug: workspace.slug });
}

export async function PATCH(req: Request) {
  try {
    const { workspace, role } = await requireWorkspace();
    
    if (role !== "OWNER" && role !== "ADMIN") {
      return apiError("FORBIDDEN", "Insufficient permissions to update workspace settings.");
    }

    const userId = (await requireWorkspace()).session.user.id;

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

    return apiSuccess({ name: updated.name, plan: updated.plan, slug: updated.slug });
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to update workspace.");
  }
}

export async function DELETE() {
  try {
    const { workspace, role } = await requireWorkspace();

    if (role !== "OWNER") {
      return apiError("FORBIDDEN", "Only the workspace owner can delete the workspace.");
    }

    const userId = (await requireWorkspace()).session.user.id;

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
    console.error("[WORKSPACE_DELETE_ERROR]", err);
    return apiError("INTERNAL_ERROR", "Failed to delete workspace.");
  }
}
