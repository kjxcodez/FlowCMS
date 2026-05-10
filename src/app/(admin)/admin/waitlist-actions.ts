"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { generateSecureToken } from "@/lib/tokens";
import { sendApprovalEmail, sendInviteEmail } from "@/lib/email/index";

/**
 * APPROVE: Move CONFIRMED -> APPROVED
 */
export async function approveWaitlistEntry(id: string) {
  const session = await requireAdmin();

  return await prisma.$transaction(async (tx) => {
    const entry = await tx.waitlistEntry.findUnique({ where: { id } });

    if (!entry || entry.status !== "CONFIRMED") {
      throw new Error("Entry must be in CONFIRMED status to be approved.");
    }

    const updated = await tx.waitlistEntry.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "WAITLIST_APPROVED",
        resourceType: "WAITLIST_ENTRY",
        resourceId: id,
        resourceName: entry.email,
      }
    });

    // Send approval notice (optional/deterministic)
    await sendApprovalEmail(updated);

    logger.info("Waitlist entry approved", { id, email: entry.email });
    
    revalidatePath("/admin/waitlist");
    return { success: true };
  });
}

/**
 * INVITE: Move APPROVED -> INVITED and send email
 */
export async function sendInvite(id: string) {
  const session = await requireAdmin();

  return await prisma.$transaction(async (tx) => {
    const entry = await tx.waitlistEntry.findUnique({ where: { id } });

    if (!entry || entry.status !== "APPROVED") {
      throw new Error("Entry must be in APPROVED status to receive an invite.");
    }

    const inviteToken = generateSecureToken();
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const updated = await tx.waitlistEntry.update({
      where: { id },
      data: {
        status: "INVITED",
        inviteToken,
        inviteSentAt: new Date(),
        inviteExpiresAt,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "WAITLIST_INVITED",
        resourceType: "WAITLIST_ENTRY",
        resourceId: id,
        resourceName: entry.email,
      }
    });

    const emailResult = await sendInviteEmail(updated);

    if (!emailResult.success) {
      throw new Error("Failed to send invite email. Operation aborted.");
    }

    logger.info("Waitlist invite sent", { id, email: entry.email });
    
    revalidatePath("/admin/waitlist");
    return { success: true };
  });
}

/**
 * RESEND: Refreshes token and resends invite
 */
export async function resendInvite(id: string) {
  const session = await requireAdmin();

  return await prisma.$transaction(async (tx) => {
    const entry = await tx.waitlistEntry.findUnique({ where: { id } });

    if (!entry || entry.status !== "INVITED") {
      throw new Error("Can only resend invites to users already in INVITED status.");
    }

    // Refresh token and expiry
    const inviteToken = generateSecureToken();
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const updated = await tx.waitlistEntry.update({
      where: { id },
      data: {
        inviteToken,
        inviteSentAt: new Date(),
        inviteExpiresAt,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "WAITLIST_INVITED",
        resourceType: "WAITLIST_ENTRY",
        resourceId: id,
        resourceName: entry.email,
        after: { event: "RESEND" },
      }
    });

    const emailResult = await sendInviteEmail(updated);

    if (!emailResult.success) {
      throw new Error("Failed to resend invite email.");
    }

    logger.info("Waitlist invite resent", { id, email: entry.email });
    
    revalidatePath("/admin/waitlist");
    return { success: true };
  });
}

/**
 * REVOKE: Move INVITED -> REVOKED
 */
export async function revokeInvite(id: string) {
  const session = await requireAdmin();

  return await prisma.$transaction(async (tx) => {
    const entry = await tx.waitlistEntry.findUnique({ where: { id } });
    if (!entry) throw new Error("Entry not found");

    await tx.waitlistEntry.update({
      where: { id },
      data: {
        status: "REVOKED",
        inviteToken: null, // Nullify token immediately
      },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "WAITLIST_REVOKED",
        resourceType: "WAITLIST_ENTRY",
        resourceId: id,
        resourceName: entry.email,
      }
    });

    logger.info("Waitlist invite revoked", { id });
    revalidatePath("/admin/waitlist");
    return { success: true };
  });
}

/**
 * SUSPEND: Mark User as suspended and block access
 */
export async function suspendUser(entryId: string) {
  const session = await requireAdmin();

  return await prisma.$transaction(async (tx) => {
    const entry = await tx.waitlistEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new Error("Entry not found");

    // 1. Update waitlist status
    await tx.waitlistEntry.update({
      where: { id: entryId },
      data: { status: "SUSPENDED" },
    });

    // 2. If user exists, block them at auth level
    const user = await tx.user.findUnique({ where: { email: entry.email } });
    if (user) {
      await tx.user.update({
        where: { id: user.id },
        data: { isSuspended: true },
      });
      
      // 3. Revoke all sessions
      await tx.session.deleteMany({ where: { userId: user.id } });
    }

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "WAITLIST_SUSPENDED",
        resourceType: "WAITLIST_ENTRY",
        resourceId: entryId,
        resourceName: entry.email,
      }
    });

    logger.warn("User suspended", { email: entry.email });
    revalidatePath("/admin/waitlist");
    return { success: true };
  });
}

/**
 * RESTORE: Unsuspend user
 */
export async function restoreUser(entryId: string) {
  const session = await requireAdmin();

  return await prisma.$transaction(async (tx) => {
    const entry = await tx.waitlistEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new Error("Entry not found");

    await tx.waitlistEntry.update({
      where: { id: entryId },
      data: { status: "JOINED" },
    });

    const user = await tx.user.findUnique({ where: { email: entry.email } });
    if (user) {
      await tx.user.update({
        where: { id: user.id },
        data: { isSuspended: false },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "WAITLIST_RESTORED",
        resourceType: "WAITLIST_ENTRY",
        resourceId: entryId,
        resourceName: entry.email,
      }
    });

    revalidatePath("/admin/waitlist");
    return { success: true };
  });
}
