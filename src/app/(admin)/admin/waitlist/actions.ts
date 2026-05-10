"use server";

import { prisma } from "@/lib/prisma";
import { sendInviteEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

export async function inviteUser(id: string) {
  const entry = await prisma.waitlistEntry.findUnique({ where: { id } });
  if (!entry) throw new Error("Entry not found");

  const res = await sendInviteEmail(entry);
  if (!res.success) throw new Error("Failed to send invite");

  revalidatePath("/admin/waitlist");
}

export async function approveUser(id: string) {
  await prisma.waitlistEntry.update({
    where: { id },
    data: { status: "APPROVED" },
  });

  revalidatePath("/admin/waitlist");
}
