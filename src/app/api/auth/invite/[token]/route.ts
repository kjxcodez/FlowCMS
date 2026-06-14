import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // 1. Check session
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    // Return 401 for API/test requests, or redirect to register for browser requests
    if (req.headers.get("accept")?.includes("text/html")) {
      // Find invite first to pass email to register callback
      const invitation = await prisma.invitation.findUnique({
        where: { token },
      });
      const emailParam = invitation ? `&email=${encodeURIComponent(invitation.email)}` : "";
      return NextResponse.redirect(
        new URL(`/auth/register?callbackUrl=${encodeURIComponent(`/api/auth/invite/${token}`)}${emailParam}`, req.url)
      );
    }
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Fetch the invitation inside transaction (pessimistic check)
      const invitation = await tx.invitation.findUnique({
        where: { token },
      });

      if (!invitation) {
        return { error: "NOT_FOUND", status: 404 };
      }

      if (invitation.status !== "PENDING") {
        return { error: "REUSED", status: 409 };
      }

      if (invitation.expiresAt < new Date()) {
        // Enforce expiration by updating DB status to EXPIRED
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: "EXPIRED" },
        });

        // Audit Log for expired invite
        await tx.auditLog.create({
          data: {
            workspaceId: invitation.workspaceId,
            userId: session.user.id,
            action: "INVITE_EXPIRED",
            resourceType: "INVITATION",
            resourceId: invitation.id,
            resourceName: invitation.email,
            after: { email: invitation.email, reason: "expired" },
            ip: req.headers.get("x-forwarded-for"),
            userAgent: req.headers.get("user-agent"),
          },
        });

        return { error: "EXPIRED", status: 410 };
      }

      // Normalize emails (lowercase and trim)
      const inviteEmailNormalized = invitation.email.trim().toLowerCase();
      const sessionEmailNormalized = session.user.email.trim().toLowerCase();

      if (inviteEmailNormalized !== sessionEmailNormalized) {
        // Audit Log for mismatch attempt
        await tx.auditLog.create({
          data: {
            workspaceId: invitation.workspaceId,
            userId: session.user.id,
            action: "INVITE_MISMATCH",
            resourceType: "INVITATION",
            resourceId: invitation.id,
            resourceName: invitation.email,
            after: { 
              inviteEmail: invitation.email, 
              sessionEmail: session.user.email,
              reason: "email_mismatch" 
            },
            ip: req.headers.get("x-forwarded-for"),
            userAgent: req.headers.get("user-agent"),
          },
        });

        // Audit Log for rejected acceptance
        await tx.auditLog.create({
          data: {
            workspaceId: invitation.workspaceId,
            userId: session.user.id,
            action: "INVITE_REJECTED",
            resourceType: "INVITATION",
            resourceId: invitation.id,
            resourceName: invitation.email,
            after: { reason: "email_mismatch_rejection" },
            ip: req.headers.get("x-forwarded-for"),
            userAgent: req.headers.get("user-agent"),
          },
        });

        return { error: "MISMATCH", status: 403 };
      }

      // Check if user is already a member
      const existingMember = await tx.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: invitation.workspaceId,
            userId: session.user.id,
          },
        },
      });

      if (!existingMember) {
        await tx.workspaceMember.create({
          data: {
            workspaceId: invitation.workspaceId,
            userId: session.user.id,
            role: invitation.role,
          },
        });
      }

      // Mark accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      });

      // Audit Log for successful invite acceptance
      await tx.auditLog.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId: session.user.id,
          action: "INVITE_ACCEPTED",
          resourceType: "INVITATION",
          resourceId: invitation.id,
          resourceName: invitation.email,
          after: { email: invitation.email, role: invitation.role },
          ip: req.headers.get("x-forwarded-for"),
          userAgent: req.headers.get("user-agent"),
        },
      });

      return { success: true, workspaceId: invitation.workspaceId };
    });

    if (result.success) {
      if (req.headers.get("accept")?.includes("text/html")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return NextResponse.json({ success: true });
    }

    // Handle verification failures
    if (result.status === 404) {
      return new NextResponse("Not Found", { status: 404 });
    }
    if (result.status === 409) {
      return new NextResponse("Conflict: Already accepted", { status: 409 });
    }
    if (result.status === 410) {
      return new NextResponse("Gone: Invitation expired", { status: 410 });
    }
    if (result.status === 403) {
      return new NextResponse("Forbidden: Email mismatch", { status: 403 });
    }

    return new NextResponse("Error", { status: 500 });
  } catch (err: any) {
    if (err && (err.code === "P2002" || err.message?.includes("Unique constraint failed"))) {
      logger.warn("Invitation accept conflict due to database unique constraint", { error: String(err) });
      return new NextResponse("Conflict: User is already a member or request in progress", { status: 409 });
    }
    logger.error("Failed to accept invitation", { error: String(err) });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
