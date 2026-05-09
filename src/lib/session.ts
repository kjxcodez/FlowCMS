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

/**
 * Gets the workspace for the current session user.
 * Each user has one workspace created at registration.
 */
export async function requireWorkspace() {
  const session = await requireSession();
  
  // Get the user from database to check onboarding status
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboarded: true }
  });

  // Redirect to onboarding if not completed
  // Note: we check if user exists and onboarded is explicitly false
  if (user && user.onboarded === false) {
    redirect("/onboarding");
  }

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });
  if (!member) redirect("/register");
  return {
    session,
    workspace: member.workspace,
    role: member.role,
  };
}

export async function requireAdmin() {
  const session = await requireSession();
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail || session.user.email !== adminEmail) {
    logger.warn("Unauthorized admin access attempt", { 
        userId: session.user.id, 
        email: session.user.email 
    });
    redirect("/dashboard");
  }

  return session;
}
