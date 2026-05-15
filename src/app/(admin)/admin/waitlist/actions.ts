"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { sendApprovalEmail, sendInviteEmail } from "@/lib/email";



import { generateSecureToken } from "@/lib/tokens";

export async function inviteUser(id: string) {
  const session = await requireAdmin();

  const entry = await prisma.waitlistEntry.findUnique({ where: { id } });
  if (!entry) throw new Error("Entry not found");

  // 1. Generate Secure Token & Expiry
  const rawToken = generateSecureToken();
  const inviteExpiresAt = new Date();
  inviteExpiresAt.setDate(inviteExpiresAt.getDate() + 7); // 7 day window

  // 2. Atomic DB Update to INVITED status
  // This satisfies the Better Auth gate check for status === "INVITED"
  const updatedEntry = await prisma.waitlistEntry.update({
    where: { id },
    data: {
      status: "INVITED",
      inviteToken: rawToken,
      inviteExpiresAt,
      inviteSentAt: new Date(),
    }
  });

  // 3. Send Email
  try {
    const res = await sendInviteEmail(updatedEntry);
    if (!res.success) {
      throw new Error("SMTP_FAILURE");
    }
  } catch (err) {
    // Rollback to APPROVED state so admin can retry without stale tokens
    await prisma.waitlistEntry.update({
      where: { id },
      data: {
        status: "APPROVED",
        inviteToken: null,
        inviteExpiresAt: null,
        inviteSentAt: null,
      }
    });
    
    throw new Error(`Failed to send invitation email: ${err instanceof Error ? err.message : "Unknown error"}. DB state rolled back.`);
  }

  // 4. Record Audit Trail
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

