import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { logAction } from "@/lib/audit";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspace, session, role } = await requireWorkspace();
    const { id } = await params;

    if (role !== "OWNER" && role !== "ADMIN") {
      return apiError("FORBIDDEN", "Only owners and admins can revoke invitations.");
    }

    const invitation = await prisma.invitation.findUnique({
      where: { id },
    });

    if (!invitation || invitation.workspaceId !== workspace.id) {
      return apiError("NOT_FOUND", "Invitation not found.");
    }

    await prisma.invitation.delete({
      where: { id },
    });

    // Audit Log
    logAction({
      workspaceId: workspace.id,
      userId: session.user.id,
      action: "DELETE", // Map to AuditAction.DELETE
      resourceType: "INVITATION",
      resourceId: id,
      resourceName: invitation.email,
    });

    return apiSuccess({ success: true });
  } catch {
    return apiError("INTERNAL_ERROR", "Failed to revoke invitation.");
  }
}
