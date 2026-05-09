import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { inviteUser, approveUser } from "./actions";

import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminWaitlistPage() {
  await requireAdmin();
  
  const entries = await prisma.waitlistEntry.findMany({
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight mb-2">Waitlist</h1>
          <p className="text-ink-muted font-light">Manage early access invitations and approvals.</p>
        </div>
        <div className="flex gap-4">
            <div className="text-right">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted">Total</p>
                <p className="text-2xl font-bold">{entries.length}</p>
            </div>
            <div className="text-right">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted">Joined</p>
                <p className="text-2xl font-bold">{entries.filter(e => e.status === "JOINED").length}</p>
            </div>
        </div>
      </div>

      <div className="border border-border-strong rounded-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{entry.email}</TableCell>
                <TableCell>{entry.name || "-"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-widest px-2 py-0">
                    {entry.role || "OTHER"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={entry.status === "JOINED" ? "default" : "secondary"}
                    className={cn(
                        "text-[10px] uppercase tracking-widest px-2 py-0",
                        entry.status === "INVITED" && "bg-accent-bright/20 text-accent border-accent/20"
                    )}
                  >
                    {entry.status}
                  </Badge>
                </TableCell>
                <TableCell>
                    <span className={cn(
                        "font-mono text-[10px] font-bold uppercase tracking-widest",
                        entry.priority === "HIGH" || entry.priority === "IMMEDIATE" ? "text-accent" : "text-ink-muted"
                    )}>
                        {entry.priority}
                    </span>
                </TableCell>
                <TableCell className="text-ink-muted text-xs">
                  {new Date(entry.joinedAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {entry.status === "PENDING" && (
                      <form action={approveUser.bind(null, entry.id)}>
                        <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest px-3">
                          Approve
                        </Button>
                      </form>
                    )}
                    {(entry.status === "CONFIRMED" || entry.status === "APPROVED") && (
                      <form action={inviteUser.bind(null, entry.id)}>
                        <Button variant="default" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest px-3 bg-accent-bright text-ink hover:bg-accent-bright/90">
                          Invite
                        </Button>
                      </form>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


