import { NextRequest } from "next/server";
import { requireWorkspace, requireRole, ForbiddenError } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { nanoid } from "nanoid";
import { sendEmail } from "@/lib/email";
import { WorkspaceInviteEmail } from "@/components/emails/workspace-invite";
import { logAction } from "@/lib/audit";
import { canAccessFeature } from "@/lib/launch";
import { logger } from "@/lib/logger";
import { MemberRole } from "@/generated/prisma";

export async function GET() {
  let workspace;
  try {
    const sessionRes = await requireWorkspace();
    workspace = sessionRes.workspace;
    const { session, role } = sessionRes;
    await requireRole(role, "ADMIN");

    if (!canAccessFeature("enableTeamInvites", session.user.email)) {
      return apiError("FORBIDDEN", "This feature is not available yet.");
    }
    
    const invitations = await prisma.invitation.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(invitations);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    logger.error("Failed to fetch workspace invitations", { error: err, workspaceId: typeof workspace !== "undefined" ? workspace.id : undefined });
    return apiError("INTERNAL_ERROR", "Failed to fetch invitations.");
  }
}

interface InviteRequestBody {
  email?: string;
  role?: MemberRole;
}

export async function POST(req: NextRequest) {
  let workspace;
  try {
    const sessionRes = await requireWorkspace();
    workspace = sessionRes.workspace;
    const { session, role } = sessionRes;
    await requireRole(role, "ADMIN");

    if (!canAccessFeature("enableTeamInvites", session.user.email)) {
      return apiError("FORBIDDEN", "This feature is not available yet.");
    }

    const body = (await req.json()) as InviteRequestBody;
    const email = body.email;
    const memberRole = body.role;

    if (!email || !email.includes("@")) {
      return apiError("INVALID_INPUT", "Invalid email address.");
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (memberRole === "OWNER") {
      logger.warn("Attempted to invite user with OWNER role", {
        workspaceId: workspace.id,
        invitedBy: session.user.id,
        email: normalizedEmail,
      });
      return apiError(
        "INVALID_INPUT",
        "Cannot invite users with OWNER role."
      );
    }

    // 1. Check if already a member
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: workspace.id,
        user: { email: normalizedEmail },
      },
    });

    if (existingMember) {
      return apiError("INVALID_INPUT", "User is already a member of this workspace.");
    }

    // 2. Generate invite token
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.invitation.upsert({
      where: { 
        workspaceId_email: {
          workspaceId: workspace.id,
          email: normalizedEmail,
        }
      },
      update: {
        token,
        role: memberRole || "EDITOR",
        expiresAt,
        status: "PENDING",
        createdAt: new Date(),
      },
      create: {
        workspaceId: workspace.id,
        email: normalizedEmail,
        role: memberRole || "EDITOR",
        token,
        invitedById: session.user.id,
        expiresAt,
      },
    });

    // 3. Send Email
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;
    await sendEmail({
      to: normalizedEmail,
      subject: `Join ${workspace.name} on FlowCMS`,
      react: WorkspaceInviteEmail({
        workspaceName: workspace.name,
        invitedBy: session.user.name || session.user.email,
        inviteLink,
      }),
    });

    // 4. Audit Log
    logAction({
      workspaceId: workspace.id,
      userId: session.user.id,
      action: "MEMBER_INVITED",
      resourceType: "INVITATION",
      resourceId: invitation.id,
      resourceName: normalizedEmail,
      after: { email: normalizedEmail, role: memberRole },
    });

    return apiSuccess({ id: invitation.id, email: invitation.email });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    logger.error("Workspace invitation operation failed", { error: err, workspaceId: typeof workspace !== "undefined" ? workspace.id : undefined });
    return apiError("INTERNAL_ERROR", "Failed to send invitation.");
  }
}

