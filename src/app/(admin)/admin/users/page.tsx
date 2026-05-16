import React from "react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { 
  Users, 
  Search, 
  ShieldAlert, 
  Mail, 
  Calendar,
  Activity
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      workspaceMembers: {
        include: { workspace: true }
      }
    }
  });

  return (
    <div className="p-12 space-y-12 animate-in fade-in duration-700">
      <header className="space-y-2">
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-accent-bright uppercase tracking-widest mb-2">
          <Users className="size-3" />
          Identity Management
        </div>
        <h1 className="font-display text-4xl font-bold text-white tracking-tight">
          Platform <em className="italic text-accent-bright not-italic">Users</em>
        </h1>
        <p className="text-white/40 font-light max-w-xl">
          Global user visibility, account suspension, and authentication lifecycle management.
        </p>
      </header>

      <div className="border border-white/5 rounded-sm overflow-hidden bg-sidebar shadow-2xl">
        <Table>
          <TableHeader className="bg-white/[0.02]">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 py-4">User</TableHead>
              <TableHead className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 py-4">Workspaces</TableHead>
              <TableHead className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 py-4">Status</TableHead>
              <TableHead className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 py-4">Joined</TableHead>
              <TableHead className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 py-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                <TableCell>
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-xs">
                      {u.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{u.email}</p>
                      <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{u.name || "UNIDENTIFIED"}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {u.workspaceMembers.map(m => (
                      <Badge key={m.workspace.id} variant="outline" className="text-[9px] border-white/5 text-white/40">
                        {m.workspace.slug}
                      </Badge>
                    ))}
                    {u.workspaceMembers.length === 0 && <span className="text-[10px] text-white/10 italic">None</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn(
                    "text-[9px] font-bold px-2 py-0 h-5 uppercase tracking-widest",
                    u.isSuspended ? "bg-red-500/20 text-red-500 border-red-500/20" : "bg-emerald-500/20 text-emerald-500 border-emerald-500/20"
                  )}>
                    {u.isSuspended ? "SUSPENDED" : "ACTIVE"}
                  </Badge>
                </TableCell>
                <TableCell className="text-white/20 text-[10px] font-mono">
                  {new Date(u.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="h-8 text-[9px] font-bold uppercase tracking-widest text-white/40 hover:text-red-500 hover:bg-red-500/10">
                    <ShieldAlert className="size-3 mr-2" />
                    Suspend
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
