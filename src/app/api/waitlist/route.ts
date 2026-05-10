import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendWaitlistConfirmation } from "@/lib/email/index";
import { generateReferralCode, generateSecureToken } from "@/lib/tokens";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextRequest } from "next/server";
import { WaitlistPriority, WaitlistRole } from "@/generated/prisma";

const schema = z.object({
  email:   z.string().email().toLowerCase().trim(),
  name:    z.string().min(1).max(100).optional(),
  role:    z.nativeEnum(WaitlistRole).optional(),
  useCase: z.string().max(300).optional(),
  source:  z.string().max(100).optional(),
  ref:     z.string().optional(),
});

function derivePriority(role?: WaitlistRole): WaitlistPriority {
  const HIGH_PRIORITY_ROLES = new Set<WaitlistRole>([
    WaitlistRole.AGENCY,
    WaitlistRole.FOUNDER,
    WaitlistRole.OPEN_SOURCE_MAINTAINER,
  ]);
  return role && HIGH_PRIORITY_ROLES.has(role)
    ? WaitlistPriority.HIGH
    : WaitlistPriority.NORMAL;
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  // 1. Rate Limit
  const ip = req.headers.get("x-forwarded-for") || "anonymous";
  const rl = await checkRateLimit(ip, "PUBLIC");
  
  if (!rl.allowed) {
    return jsonResponse({ error: "Too many requests. Please try again later." }, 429);
  }

  // 2. Parse Body
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid input. Please check your email and fields." }, 400);
  }

  const { email, name, role, useCase, source, ref } = parsed.data;

  // 3. Check for existing entry
  const existing = await prisma.waitlistEntry.findUnique({ where: { email } });
  if (existing) {
    // Duplicate submission cooldown: resend confirmation if it's been more than 10 minutes since joinedAt
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (!existing.confirmedAt && existing.joinedAt < tenMinutesAgo) {
      sendWaitlistConfirmation(existing).catch((err) => {
        console.error("Waitlist resend failed:", err);
      });
    }

    return jsonResponse({
      success: true,
      alreadyJoined: true,
      position: existing.position,
      referralCode: existing.referralCode,
      referralUrl: `${process.env.NEXT_PUBLIC_APP_URL}/?ref=${existing.referralCode}`,
    });
  }

  // 4. Handle Referrer
  const normalizedRef = ref?.toLowerCase();
  const referrer = normalizedRef
    ? await prisma.waitlistEntry.findUnique({ where: { referralCode: normalizedRef } })
    : null;

  if (referrer && referrer.email === email) {
    return jsonResponse({ error: "You cannot use your own referral code." }, 400);
  }

  try {
    // 5. Create Entry + Referral Logic Atomically
    const inviteToken = generateSecureToken();

    const entry = await prisma.$transaction(async (tx) => {
      // Get current count for position assignment
      const count = await tx.waitlistEntry.count();
      const position = count + 1;

      let newEntry;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          newEntry = await tx.waitlistEntry.create({
            data: {
              email,
              name,
              role,
              useCase,
              source,
              position,
              inviteToken,
              referredBy: referrer?.email ?? null,
              referralCode: generateReferralCode(name || undefined),
              priority: derivePriority(role),
            },
          });
          break; // Success
        } catch (error: any) {
          attempts++;
          if (error.code === "P2002" && attempts < maxAttempts) {
            continue; // Retry with new referral code
          }
          throw error; // Rethrow on final attempt or other error
        }
      }

      if (!newEntry) throw new Error("Failed to create waitlist entry after retries");

      // Increment referrer count atomically if applicable
      if (referrer) {
        await tx.waitlistEntry.update({
          where: { id: referrer.id },
          data: { referralCount: { increment: 1 } },
        });
      }

      return newEntry;
    });

    // 6. Send confirmation email (Fire and forget)
    sendWaitlistConfirmation(entry).catch((err) => {
        console.error("Waitlist confirmation email failed", err);
    });

    return jsonResponse({
      success: true,
      position: entry.position,
      referralCode: entry.referralCode,
      referralUrl: `${process.env.NEXT_PUBLIC_APP_URL}/?ref=${entry.referralCode}`,
    }, 201);

  } catch (e: unknown) {
    console.error("Waitlist creation error", e);
    return jsonResponse({ error: "Something went wrong. Please try again." }, 500);
  }
}
