import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "./prisma";
import { redirect } from "next/navigation";

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
