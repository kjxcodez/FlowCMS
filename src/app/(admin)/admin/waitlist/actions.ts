"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { sendApprovalEmail, sendInviteEmail } from "@/lib/email";



export async function inviteUser(id: string) {
  const session = await requireAdmin();

  const entry = await prisma.waitlistEntry.findUnique({ where: { id } });
  if (!entry) throw new Error("Entry not found");

  const res = await sendInviteEmail(entry);
  if (!res.success) throw new Error("Failed to send invite");

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "WAITLIST_INVITED",
      resourceType: "WAITLIST_ENTRY",
      resourceId: id,
      resourceName: entry.email,
    }
  });

  revalidatePath("/admin/waitlist");
}

export async function approveUser(id: string) {
  const session = await requireAdmin();

  const entry = await prisma.waitlistEntry.findUnique({ where: { id } });
  if (!entry) throw new Error("Entry not found");

  const updated = await prisma.waitlistEntry.update({
    where: { id },
    data: { status: "APPROVED" },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "WAITLIST_APPROVED",
      resourceType: "WAITLIST_ENTRY",
      resourceId: id,
      resourceName: entry.email,
    }
  });

  await sendApprovalEmail(updated);

  revalidatePath("/admin/waitlist");
}

