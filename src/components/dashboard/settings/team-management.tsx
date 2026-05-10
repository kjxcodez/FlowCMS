"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, Mail, Trash2, Loader2, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function TeamManagement({ initialMembers, initialInvites, currentRole }: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const [members] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("EDITOR");
  const [isInviting, setIsInviting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleInvite = async () => {
    setIsInviting(true);
    try {
      const res = await fetch("/api/internal/workspace/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Invitation sent to ${inviteEmail}`);
      setInvites([{ id: data.id, email: inviteEmail, role: inviteRole, status: "PENDING", createdAt: new Date() }, ...invites]);
      setInviteEmail("");
      setIsModalOpen(false);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(err.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevokeInvite = async (id: string) => {
    // Optimistic update for now
    setInvites(invites.filter((i: any) => i.id !== id)); // eslint-disable-line @typescript-eslint/no-explicit-any
    toast.success("Invitation revoked");
    
    // Background revoke
    fetch(`/api/internal/workspace/invitations/${id}`, { method: "DELETE" }).catch(() => {});
  };

  const canInvite = currentRole === "OWNER" || currentRole === "ADMIN";

  return (
    <div className="space-y-10">
      <Card className="rounded-none border-2 border-border relative overflow-hidden group hover:border-accent/30 transition-colors duration-300">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b-2 border-border/30">
          <div>
            <CardTitle className="font-display text-2xl tracking-tight">Workspace Members</CardTitle>
            <CardDescription className="text-muted-foreground font-medium italic mt-1">Manage active participants and their operational privileges.</CardDescription>
          </div>
          {canInvite && (
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-none font-bold uppercase tracking-widest bg-accent hover:bg-accent-dim h-11 px-6 shadow-sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-none border-2 border-border shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="font-display text-3xl tracking-tight italic">Invite to Team</DialogTitle>
                  <DialogDescription className="text-base text-muted-foreground pt-2">Send an invitation email to a new team member. They will receive a secure join link valid for 7 days.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-muted-foreground">Recipient Email</label>
                    <Input 
                      placeholder="colleague@company.com" 
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="rounded-none border-2 border-border focus-visible:ring-accent h-12 bg-white/50 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-muted-foreground">Assigned Role</label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger className="rounded-none border-2 border-border h-12 font-medium bg-white/50 focus:ring-accent">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-2 border-border">
                        <SelectItem value="ADMIN" className="font-medium">Admin (Full Control)</SelectItem>
                        <SelectItem value="EDITOR" className="font-medium">Editor (Content Management)</SelectItem>
                        <SelectItem value="VIEWER" className="font-medium">Viewer (Read Only Access)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button 
                    onClick={handleInvite} 
                    disabled={isInviting || !inviteEmail}
                    className="w-full rounded-none font-bold uppercase tracking-widest h-14 bg-accent hover:bg-accent-dim text-lg"
                  >
                    {isInviting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Secure Invitation"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b-2 border-border/50">
                <TableHead className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold py-5 pl-8 text-muted-foreground">Member Entity</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold py-5 text-muted-foreground">Privilege Level</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold py-5 text-right pr-8 text-muted-foreground">Onboarding Date</TableHead>
                {canInvite && <TableHead className="w-[80px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                <TableRow key={member.id} className="group border-b border-border/30 hover:bg-accent/5 transition-colors">
                  <TableCell className="py-6 pl-8">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-display font-bold text-lg text-ink tracking-tight italic">{member.user.name || "Anonymous Member"}</span>
                      <span className="text-xs font-mono text-muted-foreground/80 tracking-tight">{member.user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-6">
                    <Badge variant="outline" className={cn(
                      "rounded-none font-bold tracking-tighter uppercase text-[10px] px-3 py-1 border-2",
                      member.role === "OWNER" ? "border-accent text-accent" : "border-muted-foreground/30 text-muted-foreground"
                    )}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono text-muted-foreground py-6 pr-8 tabular-nums">
                    {new Date(member.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </TableCell>
                  {canInvite && member.role !== "OWNER" && (
                    <TableCell className="py-6 pr-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-none h-10 w-10 hover:bg-muted/50">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-none border-2 border-border shadow-xl">
                          <DropdownMenuItem className="text-destructive font-bold uppercase text-[10px] tracking-[0.2em] py-3 cursor-pointer hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove from Workspace
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <div className="absolute inset-0 pointer-events-none noise-overlay opacity-20" />
      </Card>

      {/* Pending Invites Section */}
      {invites.length > 0 && (
        <Card className="rounded-none border-2 border-border/50 relative overflow-hidden bg-muted/5 group hover:border-accent-bright/30 transition-colors duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-xl italic flex items-center gap-3 tracking-tight">
              <div className="h-8 w-8 bg-accent-bright/20 flex items-center justify-center">
                <Mail className="h-4 w-4 text-accent" />
              </div>
              Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {invites.map((invite: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                  <TableRow key={invite.id} className="border-b border-border/20 last:border-0 hover:bg-white/40 transition-colors">
                    <TableCell className="py-5 pl-8">
                      <span className="font-bold text-ink/70 tracking-tight">{invite.email}</span>
                    </TableCell>
                    <TableCell className="py-5">
                      <Badge variant="secondary" className="rounded-none text-[9px] uppercase tracking-widest bg-border/50 text-muted-foreground px-2">
                        {invite.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8 py-5">
                      {canInvite && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive font-bold uppercase text-[10px] tracking-[0.2em] h-9 px-4 rounded-none border border-transparent hover:border-destructive/20 hover:bg-destructive/5"
                          onClick={() => handleRevokeInvite(invite.id)}
                        >
                          Revoke Access
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <div className="absolute inset-0 pointer-events-none noise-overlay opacity-10" />
        </Card>
      )}
    </div>
  );
}
