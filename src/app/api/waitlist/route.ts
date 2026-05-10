import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendWaitlistConfirmation } from "@/lib/email/index";
import { generateReferralCode, generateSecureToken } from "@/lib/tokens";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

const schema = z.object({
  email:   z.string().email().toLowerCase().trim(),
  name:    z.string().min(1).max(100).optional(),
  role:    z.enum(["INDIE_DEV", "AGENCY", "FOUNDER", "OTHER"]).optional(),
  useCase: z.string().max(300).optional(),
  source:  z.string().max(100).optional(),
  ref:     z.string().optional(),
});

export async function POST(req: NextRequest) {
  // 1. Rate Limit
  const ip = req.headers.get("x-forwarded-for") || "anonymous";
  const rl = await checkRateLimit(ip, "PUBLIC");
  
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), { 
      status: 429,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 2. Parse Body
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid input. Please check your email and fields." }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { email, name, role, useCase, source, ref } = parsed.data;

  // 3. Check for existing entry
  const existing = await prisma.waitlistEntry.findUnique({ where: { email } });
  if (existing) {
    return new Response(JSON.stringify({
      success: true,
      alreadyJoined: true,
      position: existing.position,
      referralCode: existing.referralCode,
      referralUrl: `${process.env.NEXT_PUBLIC_APP_URL}/?ref=${existing.referralCode}`,
    }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 4. Handle Referrer
  const referrer = ref
    ? await prisma.waitlistEntry.findUnique({ where: { referralCode: ref } })
    : null;

  try {
    // 5. Create Entry
    const position = await prisma.waitlistEntry.count() + 1;
    const inviteToken = generateSecureToken();

    const entry = await prisma.waitlistEntry.create({
      data: {
        email,
        name,
        role: role as any,
        useCase,
        source,
        position,
        inviteToken,
        referredBy: referrer?.email ?? null,
        referralCode: generateReferralCode(name || undefined),
        priority: role === "AGENCY" ? "HIGH" : "NORMAL",
      },
    });

    // 6. Increment referrer count
    if (referrer) {
      await prisma.waitlistEntry.update({
        where: { id: referrer.id },
        data: { referralCount: { increment: 1 } },
      });
    }

    // 7. Send confirmation email (Fire and forget or waitUntil if supported)
    sendWaitlistConfirmation(entry).catch((err) => {
        console.error("Waitlist confirmation email failed", err);
    });

    return new Response(JSON.stringify({
      success: true,
      position,
      referralCode: entry.referralCode,
      referralUrl: `${process.env.NEXT_PUBLIC_APP_URL}/?ref=${entry.referralCode}`,
    }), { 
      status: 201,
      headers: { "Content-Type": "application/json" }
    });

  } catch (e: any) {
    console.error("Waitlist creation error", e);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
