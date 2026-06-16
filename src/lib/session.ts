import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "./prisma";
import { redirect } from "next/navigation";
import { logger } from "./logger";
import { isAdminEmail } from "./admin";
import { DEFAULT_LOGIN_REDIRECT } from "./routes";

export async function getSession() {
  let reqHeaders: any;
  try {
    reqHeaders = await headers();
  } catch {
    // Safe fallback when run outside of Next.js request context (e.g., in offline tests)
  }
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });
  return session;
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  return session;
}

/**
 * Higher-order helper for server actions and routes that require administrative privileges.
 * Consolidates check to process.env.ADMIN_EMAILS.
 */
export async function requireAdmin() {
  const session = await requireSession();
  const isPlatformAdmin = isAdminEmail(session.user.email);

  if (!isPlatformAdmin) {
    logger.warn("Unauthorized admin access attempt", {
      userId: session.user.id,
      email: session.user.email
    });
    redirect(DEFAULT_LOGIN_REDIRECT);
  }

  return session;
}

/**
 * Gets the workspace for the current session user.
 * Each user has one workspace created at registration.
 * Membership is strictly enforced. No mock "admin" workspaces allowed.
 */
export async function requireWorkspace() {
  const session = await requireVerifiedSession();
  const isPlatformAdmin = isAdminEmail(session.user.email);

  // Get the user from database to check onboarding status
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboarded: true }
  });

  // Redirect to onboarding if not completed
  // Admins are NOT exempt from onboarding if they want to use a workspace
  if (user && user.onboarded === false) {
    redirect("/onboarding");
  }

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });

  // If not a member, redirect. No "admin" shadow membership.
  if (!member) {
    if (isPlatformAdmin) {
      // Admins without a workspace go to a safe spot, but they can't perform workspace actions
      redirect(DEFAULT_LOGIN_REDIRECT);
    }
    redirect("/auth/register");
  }

  return {
    session,
    workspace: member.workspace,
    role: member.role,
  };
}

export class ForbiddenError extends Error {
  constructor(message = "Insufficient permissions") {
    super(message);
    this.name = "ForbiddenError";
  }
}

import { MemberRole } from "@/generated/prisma";

const ROLE_LEVELS: Record<MemberRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  EDITOR: 2,
  VIEWER: 1,
};

export function hasRole(currentRole: MemberRole, requiredRole: MemberRole): boolean {
  return (ROLE_LEVELS[currentRole] ?? 0) >= (ROLE_LEVELS[requiredRole] ?? 0);
}

/**
 * Validates permission level. Throws ForbiddenError if unauthorized.
 * Supports a future-proof resource-level check parameter.
 */
export async function requireRole(
  currentRole: MemberRole,
  requiredRole: MemberRole,
  resourceCheck?: () => boolean | Promise<boolean>
) {
  if (!hasRole(currentRole, requiredRole)) {
    throw new ForbiddenError(`Insufficient permissions. Required role: ${requiredRole}`);
  }
  if (resourceCheck) {
    const isAllowed = await resourceCheck();
    if (!isAllowed) {
      throw new ForbiddenError("Access to the requested resource is denied.");
    }
  }
}


export async function requireVerifiedSession() {
  const session = await requireSession();

  // Local development bypass to maximize developer activation speed
  if (process.env.NODE_ENV === "development" || !process.env.RESEND_API_KEY) {
    return session;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      emailVerified: true,
    },
  });

  // IMPORTANT:
  // allow access TO the verification page itself
  if (!user?.emailVerified) {
    redirect("/auth/verify-email");
  }

  return session;
}