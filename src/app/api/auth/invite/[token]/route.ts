import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { logAction } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  // Use await params for Next.js 15
  const { token } = await params;

  // 1. Verify invitation
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { workspace: true },
  });

  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/login?error=invalid_invite", req.url));
  }

  // 2. Check session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    // Redirect to register with callback
    return NextResponse.redirect(
      new URL(`/register?callbackUrl=/api/auth/invite/${token}&email=${invitation.email}`, req.url)
    );
  }

  // 3. Join workspace
  try {
    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (!existingMember) {
      await prisma.$transaction([
        prisma.workspaceMember.create({
          data: {
            workspaceId: invitation.workspaceId,
            userId: session.user.id,
            role: invitation.role,
          },
        }),
        prisma.invitation.update({
          where: { id: invitation.id },
          data: { 
            status: "ACCEPTED",
            acceptedAt: new Date(),
          },
        }),
      ]);

      // 4. Audit Log
      logAction({
        workspaceId: invitation.workspaceId,
        userId: session.user.id,
        action: "JOINED",
        resourceType: "WORKSPACE",
        resourceId: invitation.workspaceId,
        resourceName: session.user.email,
      });
    }

    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (err) {
    console.error("[INVITE_ACCEPT_ERROR]", err);
    return NextResponse.redirect(new URL("/dashboard?error=join_failed", req.url));
  }
}
