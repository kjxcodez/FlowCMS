import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TeamManagement } from "@/components/dashboard/settings/team-management";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Management | FlowCMS",
  description: "Manage your workspace members and invitations.",
};

export default async function TeamPage() {
  const { workspace, role } = await requireWorkspace();

  // Fetch current members
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: workspace.id },
    include: { 
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        }
      }
    },
    orderBy: { createdAt: "asc" },
  });

  // Fetch pending invites
  const invites = await prisma.invitation.findMany({
    where: { 
      workspaceId: workspace.id,
      status: "PENDING",
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24">
      <div className="relative">
        <div className="flex flex-col gap-1">
          <h1 className="text-6xl font-display font-black tracking-tighter italic uppercase text-sidebar">
            Team<span className="text-accent">.</span>
          </h1>
          <div className="flex items-center gap-4">
             <div className="h-px bg-border flex-grow" />
             <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-[0.4em] font-bold">
               Access Control & Collaboration
             </p>
          </div>
        </div>
      </div>

      <TeamManagement 
        initialMembers={members} 
        initialInvites={invites} 
        currentRole={role}
        workspaceId={workspace.id}
      />

      {/* Decorative footer element for Meridian aesthetic */}
      <div className="pt-12 flex justify-center">
        <div className="h-2 w-24 bg-border/20" />
      </div>
    </div>
  );
}
