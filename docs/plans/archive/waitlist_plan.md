
FlowCMS
Waitlist · Admin Panel · Feature Flag System
Complete implementation plan — from landing page to launch flip
Component	Status	Scope
Waitlist system	To build	DB schema, API route, email confirm, position tracking
Feature flag (LAUNCH_MODE)	To build	Middleware, env var, all route protection
Admin panel — waitlist	To build	View, approve, export, bulk invite
Admin panel — core	To build	Users, workspaces, usage, plan override
Early access invite flow	To build	One-time token, approval email, onboarding gate
Waitlist landing page section	To refine	Form UI, social proof, position counter

Version 1.0  ·  May 2026  ·  Solo Founder Execution
 
Part 1 — Feature Flag System

One environment variable controls the entire application mode. No code changes needed to launch — flip the variable in Vercel, redeploy in 30 seconds.

1.1  The Three Modes
LAUNCH_MODE value	What users can access	When to use
"waitlist"	Landing page (/) + waitlist API only. Everything else → redirect to /	Before launch. Right now.
"early_access"	Landing + waitlist + approved users with invite token can log in	Selective beta before full open
"open"	Everything. Full app accessible to all.	Public launch day

Current state should be "waitlist". You flip to "early_access" when you start approving beta users. You flip to "open" on launch day. Three states, one variable, zero code changes.

1.2  Environment Variables
# .env.local (development)
NEXT_PUBLIC_LAUNCH_MODE="waitlist"

# Vercel → Settings → Environment Variables
NEXT_PUBLIC_LAUNCH_MODE="waitlist"     # right now
NEXT_PUBLIC_LAUNCH_MODE="early_access" # when inviting beta users
NEXT_PUBLIC_LAUNCH_MODE="open"         # launch day

# Admin access (separate from launch mode)
ADMIN_EMAIL="your@email.com"

# Email (Resend)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="hello@flowcms.dev"
RESEND_FROM_NAME="FlowCMS"

# App URL (used in email links)
NEXT_PUBLIC_APP_URL="https://flowcms.dev"

1.3  Middleware Implementation
This is the single most important file. It enforces mode at the edge — no request slips through.

// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type LaunchMode = "waitlist" | "early_access" | "open";

const MODE = (process.env.NEXT_PUBLIC_LAUNCH_MODE ?? "waitlist") as LaunchMode;

// Always accessible regardless of mode
const ALWAYS_PUBLIC = [
  "/",
  "/api/waitlist",
  "/api/health",
  "/docs",         // keep docs public even in waitlist mode
];

// Only accessible with a valid invite token (early_access mode)
const INVITE_GATE = [
  "/login",
  "/signup",
  "/onboarding",
];

// Only accessible when mode = "open"
const OPEN_ONLY = [
  "/dashboard",
  "/api/auth",
  "/api/v1",
  "/api/internal",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin is always accessible (protected by its own auth)
  if (pathname.startsWith("/admin")) return NextResponse.next();

  // Static assets always pass
  const isAlwaysPublic = ALWAYS_PUBLIC.some(
    p => pathname === p || pathname.startsWith(p + "/"),
  );
  if (isAlwaysPublic) return NextResponse.next();

  // WAITLIST MODE: only public paths allowed
  if (MODE === "waitlist") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // EARLY_ACCESS MODE: check invite token for protected pages
  if (MODE === "early_access") {
    const isInviteGated = INVITE_GATE.some(p => pathname.startsWith(p));
    if (isInviteGated) {
      const token = request.nextUrl.searchParams.get("invite");
      if (!token) {
        return NextResponse.redirect(new URL("/?waitlist=gated", request.url));
      }
      // Token validation happens in the page/route handler
      return NextResponse.next();
    }
    // Non-invite-gated protected paths → redirect
    const isOpenOnly = OPEN_ONLY.some(p => pathname.startsWith(p));
    if (isOpenOnly) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts|images|icons).*)"],
};

1.4  Client-Side Mode Awareness
Use the env variable on the client to conditionally render nav items, CTAs, and banners — no extra API calls.

// src/lib/launch.ts
export const LAUNCH_MODE = process.env.NEXT_PUBLIC_LAUNCH_MODE ?? "waitlist";

export const isWaitlistMode    = LAUNCH_MODE === "waitlist";
export const isEarlyAccessMode = LAUNCH_MODE === "early_access";
export const isOpenMode        = LAUNCH_MODE === "open";

// Usage in components:
// import { isOpenMode } from "@/lib/launch";
// {isOpenMode && <Link href="/login">Sign in</Link>}
// {isWaitlistMode && <WaitlistBanner />}
 
Part 2 — Database Schema

2.1  WaitlistEntry Model
model WaitlistEntry {
  id           String    @id @default(cuid())
  email        String    @unique
  name         String?

  // Segmentation — helps you prioritise who to invite first
  role         WaitlistRole?   // indie_dev | agency | founder | other
  useCase      String?         // free text: "building a blog", "agency with 5 clients"
  source       String?         // "twitter" | "product_hunt" | "google" | "friend" | "other"
  referredBy   String?         // email of referrer (for referral tracking)

  // Position & priority
  position     Int             // set on create via COUNT()+1
  priority     WaitlistPriority @default(NORMAL)

  // Approval flow
  status       WaitlistStatus  @default(PENDING)
  inviteToken  String?         @unique  // set when approved
  inviteSentAt DateTime?
  inviteUsedAt DateTime?
  inviteExpiresAt DateTime?    // 7 days from sent

  // Confirmation
  confirmed    Boolean         @default(false)
  confirmedAt  DateTime?

  // Referral
  referralCode String?         @unique  // their personal referral link code
  referralCount Int            @default(0)

  joinedAt     DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  @@index([status, joinedAt])
  @@index([priority, joinedAt])
  @@index([inviteToken])
  @@index([referralCode])
}

enum WaitlistRole {
  INDIE_DEV
  AGENCY
  FOUNDER
  OTHER
}

enum WaitlistStatus {
  PENDING       // just joined, no action taken
  CONFIRMED     // verified their email
  APPROVED      // admin approved, invite not yet sent
  INVITED       // invite email sent
  JOINED        // used the invite, created account
  REJECTED      // will not be invited (spam, etc.)
}

enum WaitlistPriority {
  LOW
  NORMAL
  HIGH      // set by admin for VIP/agency users
  IMMEDIATE // invite next batch
}
 
Part 3 — API Routes

3.1  POST /api/waitlist — Join the waitlist
// src/app/api/waitlist/route.ts
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendWaitlistConfirmation } from "@/lib/email";
import { generateReferralCode } from "@/lib/tokens";

const schema = z.object({
  email:   z.string().email().toLowerCase().trim(),
  name:    z.string().min(1).max(100).optional(),
  role:    z.enum(["INDIE_DEV","AGENCY","FOUNDER","OTHER"]).optional(),
  useCase: z.string().max(300).optional(),
  source:  z.string().max(100).optional(),
  ref:     z.string().optional(), // referral code from ?ref= param
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid email address." }, { status: 400 });
  }

  const { email, name, role, useCase, source, ref } = parsed.data;

  // Check referrer
  const referrer = ref
    ? await prisma.waitlistEntry.findUnique({ where: { referralCode: ref } })
    : null;

  try {
    const position = await prisma.waitlistEntry.count() + 1;

    const entry = await prisma.waitlistEntry.create({
      data: {
        email, name, role, useCase, source,
        position,
        referredBy: referrer?.email ?? null,
        referralCode: generateReferralCode(), // e.g. "kapil-x7k2"
        // Agency users get HIGH priority automatically
        priority: role === "AGENCY" ? "HIGH" : "NORMAL",
      },
    });

    // Increment referrer count
    if (referrer) {
      await prisma.waitlistEntry.update({
        where: { id: referrer.id },
        data: { referralCount: { increment: 1 } },
      });
    }

    // Send confirmation email (async, dont block response)
    sendWaitlistConfirmation(entry).catch(console.error);

    return Response.json({
      success: true,
      position,
      referralCode: entry.referralCode,
      referralUrl: `${process.env.NEXT_PUBLIC_APP_URL}/?ref=${entry.referralCode}`,
    });

  } catch (e: any) {
    if (e.code === "P2002") { // unique constraint — already on waitlist
      const existing = await prisma.waitlistEntry.findUnique({ where: { email } });
      return Response.json({
        success: true,
        alreadyJoined: true,
        position: existing?.position,
        referralCode: existing?.referralCode,
      });
    }
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}

3.2  GET /api/waitlist/verify — Email confirmation
// src/app/api/waitlist/verify/route.ts
// Called when user clicks the confirmation link in their email

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return Response.redirect(new URL("/?verified=false", process.env.NEXT_PUBLIC_APP_URL!));

  const entry = await prisma.waitlistEntry.findFirst({
    where: { inviteToken: token, status: "PENDING" },
  });

  if (!entry) {
    return Response.redirect(new URL("/?verified=invalid", process.env.NEXT_PUBLIC_APP_URL!));
  }

  await prisma.waitlistEntry.update({
    where: { id: entry.id },
    data: { confirmed: true, confirmedAt: new Date(), status: "CONFIRMED" },
  });

  return Response.redirect(new URL("/?verified=true", process.env.NEXT_PUBLIC_APP_URL!));
}

3.3  /register/[provider] — Three-Layer Auth Entry Point
// src/app/register/[provider]/route.ts
// Secure entry point for both social and credential registration

export async function GET(req: Request, { params }: { params: { provider: string } }) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("invite");
  const email = searchParams.get("email");

  if (!token || !email) {
    return Response.redirect(new URL("/auth/error?code=INVITE_MISSING", process.env.NEXT_PUBLIC_APP_URL!));
  }

  const entry = await prisma.waitlistEntry.findUnique({
    where: { inviteToken: token },
  });

  if (!entry || entry.email !== email || entry.status === "JOINED") {
    return Response.redirect(new URL("/auth/error?code=INVITE_INVALID", process.env.NEXT_PUBLIC_APP_URL!));
  }

  if (entry.inviteExpiresAt && entry.inviteExpiresAt < new Date()) {
    return Response.redirect(new URL("/auth/error?code=INVITE_EXPIRED", process.env.NEXT_PUBLIC_APP_URL!));
  }

  // Set secure handoff cookie (Checkpoint 1)
  // MaxAge 600 (10 mins) is enough for the auth flow
  const cookieValue = Buffer.from(JSON.stringify({ token, email })).toString("base64");
  
  const headers = new Headers();
  headers.append("Set-Cookie", `pending_invite=${cookieValue}; HttpOnly; Secure; SameSite=Lax; Path=/; MaxAge=600`);

  // Redirect to Better Auth sign-in
  const authUrl = params.provider === "google" 
    ? "/api/auth/login/social/google" 
    : `/signup?email=${encodeURIComponent(email)}`;

  headers.append("Location", new URL(authUrl, process.env.NEXT_PUBLIC_APP_URL!).toString());
  
  return new Response(null, { status: 302, headers });
}
 
Part 4 — Email Sequences

All emails sent via Resend. Free tier: 3,000 emails/month. More than enough for the waitlist phase.

4.1  Email 1 — Waitlist Confirmation (sent immediately on join)
Field	Value
Subject	You're on the FlowCMS waitlist (#{{position}})
From	FlowCMS <hello@flowcms.dev>
Trigger	POST /api/waitlist succeeds (new entry)
Goal	Confirm email is real + give them their referral link

Email body content:
•	Opening: "You're #{{position}} on the waitlist. We're building something worth waiting for."
•	One sentence on what FlowCMS is: "The headless CMS for developers who want Sanity-quality DX at Strapi-level pricing."
•	Referral section: "Jump the queue — share your link and move up for every person who joins." + their unique URL
•	Confirmation link: "Confirm your email to lock in your spot" — clicking sets status to CONFIRMED
•	No hype, no fake urgency. Honest and direct — matches the Meridian industrial tone.

4.2  Email 2 — You're Approved (sent when admin approves + invites)
Field	Value
Subject	Your FlowCMS early access is ready
From	FlowCMS <hello@flowcms.dev>
Trigger	Admin clicks "Send Invite" in admin panel
Goal	Get them to create their account

•	Opening: "We've saved you a spot. You're in."
•	Single prominent CTA button: "Create my account →" — links to /api/waitlist/accept-invite?token={{inviteToken}}
•	Token expires in 7 days — mention this once, without panic
•	What to expect: "You'll have full access to the PRO plan free for 30 days. No credit card needed."
•	PS: "Reply to this email if you hit any issues — I'm the founder and I read every message."

4.3  Email 3 — Invite Expiry Reminder (sent 24h before token expires)
Field	Value
Subject	Your FlowCMS invite expires tomorrow
From	FlowCMS <hello@flowcms.dev>
Trigger	Cron job — 24h before inviteExpiresAt
Goal	Recover people who missed the first email

•	Short: "Your invite expires in 24 hours. Same link still works: [CTA]"
•	If they don't use it, admin can re-send from the admin panel (generates a fresh token)

4.4  Email 4 — You Moved Up (optional — sent when referrals move them up)
Field	Value
Subject	Good news — you moved up the FlowCMS waitlist
From	FlowCMS <hello@flowcms.dev>
Trigger	When referralCount crosses 3, 5, 10
Goal	Reward referrers + drive more sharing

•	"{{name}} joined using your link. You're now #{{newPosition}}."
•	Skip this email if it feels noisy — it is optional. The referral link still works without it.

4.5  Resend Implementation
// src/lib/email/index.ts
import { Resend } from "resend";
import type { WaitlistEntry } from "@prisma/client";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendWaitlistConfirmation(entry: WaitlistEntry) {
  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/waitlist/verify?token=${entry.inviteToken}`;
  const referralUrl = `${process.env.NEXT_PUBLIC_APP_URL}/?ref=${entry.referralCode}`;

  await resend.emails.send({
    from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
    to: entry.email,
    subject: `You're #${entry.position} on the FlowCMS waitlist`,
    html: waitlistConfirmationHtml({ entry, confirmUrl, referralUrl }),
  });
}

export async function sendInviteEmail(entry: WaitlistEntry) {
  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/waitlist/accept-invite?token=${entry.inviteToken}`;

  await resend.emails.send({
    from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
    to: entry.email,
    subject: "Your FlowCMS early access is ready",
    html: inviteEmailHtml({ entry, acceptUrl }),
  });

  await prisma.waitlistEntry.update({
    where: { id: entry.id },
    data: {
      status: "INVITED",
      inviteSentAt: new Date(),
      inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });
}
 
Part 5 — Admin Panel

Access: /admin — protected by ADMIN_EMAIL env check in middleware. Never linked publicly. Add Cloudflare IP allowlist for extra protection.

5.1  Admin Panel Route Map
Route	Purpose	Priority
/admin	Overview dashboard — key metrics at a glance	Build first
/admin/waitlist	Full waitlist table with filters, bulk actions	Build first
/admin/waitlist/[id]	Individual entry detail + manual actions	Build first
/admin/users	All signed-up users (post-launch)	Build later
/admin/workspaces	All workspaces, plan, usage	Build later
/admin/usage	Global API request volume chart	Build later
/admin/plans	Manual plan override	Build later
/admin/announcements	Dashboard-wide banner messages	Build later

5.2  /admin — Overview Dashboard
What you see the moment you open /admin. All numbers, no charts needed at this stage.

Metric	Query	Why it matters
Total waitlist	COUNT(*) from WaitlistEntry	Raw sign-up volume
Confirmed	COUNT(*) WHERE confirmed=true	Real email addresses
Pending review	COUNT(*) WHERE status=PENDING	Your action queue
Approved	COUNT(*) WHERE status=APPROVED	Ready to invite
Invited	COUNT(*) WHERE status=INVITED	Waiting to click
Joined	COUNT(*) WHERE status=JOINED	Converted to users
Invite conversion rate	JOINED / INVITED * 100	Is your invite email working?
Expired invites	WHERE status=INVITED AND inviteExpiresAt < NOW()	Re-send queue
Agency signups	COUNT(*) WHERE role=AGENCY	High-value leads
Today's signups	COUNT(*) WHERE joinedAt > TODAY	Growth velocity

5.3  /admin/waitlist — The Main Waitlist Table
Columns to show
Column	Data	Sortable?
#	position	Yes
Name + Email	name, email	—
Role	role badge (AGENCY = highlighted)	Yes
Priority	priority badge	Yes
Status	status badge with colour	Yes
Referrals	referralCount	Yes
Confirmed	confirmed boolean	Yes
Joined	joinedAt (relative: "3 days ago")	Yes
Actions	Approve / Invite / Reject / View	—

Filters
•	Status: All | Pending | Confirmed | Approved | Invited | Joined | Rejected
•	Role: All | Indie Dev | Agency | Founder | Other
•	Priority: All | Immediate | High | Normal | Low
•	Search: by email or name (debounced, 300ms)
•	Date range: joinedAt from/to

Bulk Actions
•	Select all (filtered) → Approve selected
•	Select all (filtered) → Send invites to approved
•	Select all (filtered) → Export to CSV
•	Select all (filtered) → Reject selected

Sort defaults
•	Default: priority DESC, joinedAt ASC (highest priority + earliest first)
•	This gives you the natural "who to invite next" order without thinking

5.4  Individual Entry Actions
Action	When available	What it does
Approve	Status: PENDING or CONFIRMED	Sets status → APPROVED, sets priority if not already HIGH
Send Invite	Status: APPROVED	Generates inviteToken, sends email, sets status → INVITED, sets inviteExpiresAt to +7d
Approve + Invite	Status: PENDING or CONFIRMED	Does both in one click — the button you'll use 90% of the time
Re-send Invite	Status: INVITED	Generates NEW token (invalidates old one), re-sends email, resets expiry
Reject	Any non-JOINED status	Sets status → REJECTED (reversible)
Un-reject	Status: REJECTED	Sets status → PENDING
Set Priority	Any status	Dropdown: IMMEDIATE / HIGH / NORMAL / LOW
Add Note	Any status	Internal admin note, not visible to user
View Referrals	Any status	Shows list of people they referred

5.5  Admin Waitlist Implementation
// src/app/api/admin/waitlist/route.ts
// GET — list with filters

export async function GET(req: Request) {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const status   = searchParams.get("status") ?? undefined;
  const role     = searchParams.get("role") ?? undefined;
  const priority = searchParams.get("priority") ?? undefined;
  const search   = searchParams.get("search") ?? undefined;
  const page     = parseInt(searchParams.get("page") ?? "1");
  const perPage  = 50;

  const where = {
    ...(status   && { status }),
    ...(role     && { role }),
    ...(priority && { priority }),
    ...(search   && {
      OR: [
        { email: { contains: search, mode: "insensitive" } },
        { name:  { contains: search, mode: "insensitive" } },
      ]
    }),
  };

  const [entries, total] = await prisma.$transaction([
    prisma.waitlistEntry.findMany({
      where,
      orderBy: [{ priority: "desc" }, { joinedAt: "asc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.waitlistEntry.count({ where }),
  ]);

  return Response.json({ entries, total, page, perPage });
}

// src/app/api/admin/waitlist/[id]/invite/route.ts
// POST — approve + send invite in one action

import { generateSecureToken } from "@/lib/tokens";
import { sendInviteEmail } from "@/lib/email";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await requireAdmin();

  const entry = await prisma.waitlistEntry.findUnique({
    where: { id: params.id }
  });

  if (!entry) return Response.json({ error: "Not found" }, { status: 404 });
  if (entry.status === "JOINED") {
    return Response.json({ error: "Already joined" }, { status: 400 });
  }

  const inviteToken = generateSecureToken(); // crypto.randomBytes(32).toString("hex")

  const updated = await prisma.waitlistEntry.update({
    where: { id: params.id },
    data: {
      inviteToken,
      status: "INVITED",
      inviteSentAt: new Date(),
      inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await sendInviteEmail(updated);

  return Response.json({ success: true });
}

5.6  Bulk Invite Route
// src/app/api/admin/waitlist/bulk-invite/route.ts
// POST — invite all APPROVED entries, or a specific set of IDs

export async function POST(req: Request) {
  await requireAdmin();

  const { ids, inviteAll } = await req.json();

  const entries = await prisma.waitlistEntry.findMany({
    where: inviteAll
      ? { status: "APPROVED" }
      : { id: { in: ids }, status: { in: ["PENDING","CONFIRMED","APPROVED"] } },
  });

  const results = await Promise.allSettled(
    entries.map(async (entry) => {
      const inviteToken = generateSecureToken();
      const updated = await prisma.waitlistEntry.update({
        where: { id: entry.id },
        data: {
          inviteToken,
          status: "INVITED",
          inviteSentAt: new Date(),
          inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      await sendInviteEmail(updated);
      return entry.id;
    })
  );

  const succeeded = results.filter(r => r.status === "fulfilled").length;
  const failed    = results.filter(r => r.status === "rejected").length;

  return Response.json({ succeeded, failed });
}

5.7  CSV Export
// src/app/api/admin/waitlist/export/route.ts

export async function GET(req: Request) {
  await requireAdmin();

  const entries = await prisma.waitlistEntry.findMany({
    orderBy: { position: "asc" },
  });

  const csv = [
    ["Position","Name","Email","Role","Priority","Status","Referrals","Confirmed","Joined"].join(","),
    ...entries.map(e => [
      e.position,
      `"${e.name ?? ""}"`,
      e.email,
      e.role ?? "",
      e.priority,
      e.status,
      e.referralCount,
      e.confirmed ? "Yes" : "No",
      e.joinedAt.toISOString().split("T")[0],
    ].join(","))
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="waitlist-${Date.now()}.csv"`,
    },
  });
}
 
Part 6 — Landing Page Waitlist Section

The only thing users can do in waitlist mode. It needs to do three jobs: collect the email, communicate value, and give them a reason to share.

6.1  Form Fields
Field	Type	Required?	Notes
Email	email input	Yes	Primary field — autofocused on load
Name	text input	No	Optional — only show if email is filled
I am a...	pill selector	No	Indie dev / Agency / Founder / Other
How did you hear?	text input	No	Optional — short, free text

Keep the form short. Email is the only required field. Every extra required field reduces conversion. Collect the rest after they confirm.

6.2  Post-Submit States
State	What user sees
Success (new)	Position number + referral link + "Check your email to confirm your spot"
Success (existing)	Their position + referral link (no error shown — handle gracefully)
Loading	Button shows spinner, form disabled
Error	Inline error message below email field — no toast

6.3  Referral Section (shown after submit)
•	"You're #{{position}}. Share your link to move up."
•	One-click copy button for the referral URL
•	Optional: Twitter/X share button with pre-filled text
•	Counter: "{{referralCount}} people have joined using your link"
•	Keep this section compact — it should not feel like a growth-hack. It should feel like a useful tool.

6.4  Social Proof Elements (above the form)
•	Waitlist counter: "{{total}} developers already waiting" — pull from GET /api/waitlist/count (cached 60s)
•	Do not fake this number. Start at 0 and let it grow. Real numbers build trust.
•	Optional: 3 avatar placeholders with "Indie devs from Bangalore, Berlin, Toronto" — no real photos until you have real users

6.5  What to Hide in Waitlist Mode
Element	Action in waitlist mode
"Sign in" / "Login" link in nav	Hidden — remove from nav entirely
"Get started" / "Start free" CTA buttons	Replace with "Join waitlist" that scrolls to form
Pricing page link	Hidden — pricing shown on landing page only, no separate /pricing route
Dashboard link	Does not exist in nav
Any "Try for free" buttons	All point to waitlist form
 
Part 7 — Early Access Invite Flow

When LAUNCH_MODE is "early_access", approved users can sign up. Everyone else still sees the waitlist. This is your selective beta phase.

7.1  The Full Journey (Three-Layer Model)
1.	User joins waitlist → confirmation email sent
2.	User confirms email → status: CONFIRMED
3.	Admin approves in /admin/waitlist → status: APPROVED
4.	Admin clicks "Send Invite" → inviteToken generated → invite email sent → status: INVITED
5.	User clicks "Create my account" → /register/google?token=xxx&email=xxx (Checkpoint 1)
6.	Checkpoint 1 validates token → Sets `pending_invite` cookie (Lax) → Redirects to Better Auth
7.	Better Auth flow starts → Social or Credentials
8.	Checkpoint 2 (Hooks) triggered → `databaseHooks.user.create.before` reads cookie via `ctx.getCookie()`
9.	Hook performs ATOMIC consumption of invite → Marks status: JOINED
10. Account creation completes → User is logged in
11. If any layer fails → Redirected to /auth/error with specific code

7.2  Granting the PRO Trial on Signup
// src/app/(auth)/signup/page.tsx or the auth callback
// After successful account creation:

async function handlePostSignup(userId: string, email: string) {
  // Check if this user came from waitlist invite
  const waitlistEntry = await prisma.waitlistEntry.findUnique({
    where: { email },
  });

  if (waitlistEntry?.status === "JOINED") {
    // Get their workspace (created during onboarding)
    const workspace = await prisma.workspace.findFirst({
      where: { members: { some: { userId } } }
    });

    if (workspace) {
      // Grant 30-day PRO trial — no credit card needed
      await prisma.workspace.update({
        where: { id: workspace.id },
        data: {
          plan: "PRO",
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }
}

7.3  Token Security Rules
•	Token is crypto.randomBytes(32).toString("hex") — 64 character hex string
•	Stored as plaintext in DB (it's a one-time use access token, not a password)
•	Expires 7 days after invite sent — checked on use
•	Single use — inviteUsedAt is set on first use, subsequent uses are rejected
•	Old token is invalidated when admin re-sends invite (new token generated)
•	Token is never logged, never in URLs that get cached (redirect target, not cache target)
 
Part 8 — Helper Utilities

8.1  Token Generation
// src/lib/tokens.ts
import crypto from "crypto";

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex"); // 64 chars
}

export function generateReferralCode(name?: string): string {
  const prefix = name
    ? name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 8)
    : "user";
  const suffix = crypto.randomBytes(3).toString("hex"); // 6 chars
  return `${prefix}-${suffix}`; // e.g. "kapil-a3f9c2"
}

8.2  requireAdmin Utility
// src/lib/admin.ts
import { auth } from "@/lib/auth"; // Better Auth
import { headers } from "next/headers";

export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.email) {
    throw new Response("Unauthorized", { status: 401 });
  }

  if (session.user.email !== process.env.ADMIN_EMAIL) {
    // Silent redirect — do not reveal admin exists
    throw Response.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_APP_URL!));
  }

  return session;
}

8.3  Cron Job — Expire Invite Reminder (Vercel Cron)
// src/app/api/cron/invite-reminder/route.ts
// Vercel cron: runs daily at 9am — add to vercel.json:
// { "crons": [{ "path": "/api/cron/invite-reminder", "schedule": "0 9 * * *" }] }

export async function GET(req: Request) {
  // Verify this is actually from Vercel Cron
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Find invites expiring in the next 24 hours that haven't been reminded
  const expiringEntries = await prisma.waitlistEntry.findMany({
    where: {
      status: "INVITED",
      inviteExpiresAt: { gte: new Date(), lte: tomorrow },
      // Only remind once — check that invite was sent more than 6 days ago
      inviteSentAt: { lte: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
    },
  });

  await Promise.allSettled(
    expiringEntries.map(entry => sendInviteExpiryReminder(entry))
  );

  return Response.json({ reminded: expiringEntries.length });
}
 
Part 9 — Implementation Order

Everything in this document, sequenced for a solo developer. Estimated total: 4–5 focused days.

Day	Task	Output
Day 1 AM	Prisma migration — WaitlistEntry model + enums	DB schema live
Day 1 PM	LAUNCH_MODE middleware + lib/launch.ts + env setup	App locked to waitlist mode
Day 2 AM	POST /api/waitlist route with Zod validation + referral code generation	Waitlist form functional
Day 2 PM	Resend setup + Email 1 (confirmation) + Email 2 (invite) templates in HTML	Emails sending
Day 3 AM	GET /api/waitlist/verify (email confirmation) + accept-invite route	Full join flow working
Day 3 PM	Landing page form component + post-submit states + referral display	Public-facing UI done
Day 4 AM	/admin layout + requireAdmin() + /admin overview dashboard	Admin accessible
Day 4 PM	/admin/waitlist table with filters, pagination, and single-entry actions	Core admin done
Day 5 AM	Bulk invite + CSV export + re-send invite routes	Admin feature complete
Day 5 PM	Cron job for expiry reminder + testing full flow end to end	Everything wired up

After Day 3: your waitlist is live and collecting emails. Days 4–5 give you the admin tools to manage and invite them. You can go public after Day 3 and finish the admin panel while signups are coming in.
 
Part 10 — Launch Sequence

10.1  The Three Flips
When	Action	Effect
Now (today)	LAUNCH_MODE="waitlist" in Vercel env	Only landing page + waitlist form visible
When ready to invite first users	LAUNCH_MODE="early_access" in Vercel + redeploy	Invite token holders can create accounts
Public launch day	LAUNCH_MODE="open" in Vercel + redeploy	Full app open to everyone

10.2  Before You Go Public (Checklist)
10.	Waitlist form submits successfully and confirmation email arrives
11.	Email confirmation link works (sets confirmed=true)
12.	Admin panel accessible at /admin with your email
13.	Waitlist table shows entries with correct filters
14.	Single invite flow works end to end (approve → send → accept → signup → PRO trial)
15.	Middleware correctly blocks /login, /dashboard, /api/auth in waitlist mode
16.	Middleware allows /admin regardless of mode
17.	CSV export downloads a valid file
18.	Referral codes generate and referral counting works
19.	Cron secret is set and the cron endpoint rejects requests without it

10.3  First Batch Invite Strategy
•	Do not invite everyone at once. Invite 10–20 users first.
•	Prioritise: AGENCY role + HIGH priority + most referrals + confirmed email
•	Wait 48 hours, monitor for issues, fix anything that breaks
•	Then invite the next 20–30. Repeat until confident.
•	Use the admin panel's natural sort (priority DESC, joinedAt ASC) — it gives you the right order automatically
•	Your goal is a stable product for 50 users before you invite 500



FlowCMS — Waitlist, Admin & Feature Flag System v1.0
May 2026  ·  Confidential  ·  Solo founder execution
