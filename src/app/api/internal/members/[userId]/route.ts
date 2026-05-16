import { NextRequest, NextResponse } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";

/**
 * Remove Member from Workspace
 * Safety rules:
 * 1. Must be OWNER to remove others.
 * 2. Cannot remove final owner.
 * 3. Cannot remove yourself (prevent self-lockout).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { workspace, session, role } = await requireWorkspace();
    const targetUserId = userId;

    if (role !== "OWNER") {
      return apiError("FORBIDDEN", "Only workspace owners can remove members.");
    }

    if (targetUserId === session.user.id) {
      return apiError("INVALID_ACTION", "You cannot remove yourself from the workspace. Use 'Leave Workspace' if available.");
    }

    const targetMember = await prisma.workspaceMember.findFirst({
      where: { workspaceId: workspace.id, userId: targetUserId }
    });

    if (!targetMember) {
      return apiError("NOT_FOUND", "User is not a member of this workspace.");
    }

    // Safety: Check if this is the last owner
    if (targetMember.role === "OWNER") {
      const ownerCount = await prisma.workspaceMember.count({
        where: { workspaceId: workspace.id, role: "OWNER" }
      });

      if (ownerCount <= 1) {
        return apiError("INVALID_ACTION", "Cannot remove the final owner of the workspace. Promote another member first.");
      }
    }

    await prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: targetUserId
        }
      }
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: session.user.id,
        action: "MEMBER_REMOVED",
        resourceType: "MEMBER",
        resourceId: targetUserId,
        resourceName: targetUserId
      }
    });

    return apiSuccess({ ok: true });
  } catch (err) {
    console.error("Member removal error:", err);
    return apiError("INTERNAL_ERROR", "Failed to remove member.");
  }
}
