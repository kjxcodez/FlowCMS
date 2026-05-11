import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "./prisma";
import { redirect } from "next/navigation";
import { logger } from "./logger";

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

import { isAdminEmail } from "./admin";

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
    redirect("/dashboard");
  }

  return session;
}

/**
 * Gets the workspace for the current session user.
 * Each user has one workspace created at registration.
 * Admins bypass membership checks to facilitate platform management.
 */
export async function requireWorkspace() {
  const session = await requireSession();
  const isPlatformAdmin = isAdminEmail(session.user.email);
  
  // Get the user from database to check onboarding status
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboarded: true }
  });

  // Redirect to onboarding if not completed (unless platform admin)
  if (!isPlatformAdmin && user && user.onboarded === false) {
    redirect("/onboarding");
  }

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });

  if (!member && !isPlatformAdmin) {
    redirect("/register");
  }

  const workspace = member?.workspace || (isPlatformAdmin ? ({ id: "admin", name: "Platform Admin", plan: "ENTERPRISE", slug: "admin" } as { id: string; name: string; plan: string; slug: string }) : null);
  
  if (!workspace) {
    redirect("/register");
  }

  return {
    session,
    workspace,
    role: member?.role || (isPlatformAdmin ? "OWNER" : null),
  };
}
