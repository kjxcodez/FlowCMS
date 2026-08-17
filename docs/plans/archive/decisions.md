# FlowCMS — Payments, Infrastructure, Admin & Docs Guide

---

## 1. Payment Gateway Decision

### The honest situation with Stripe from India

Stripe is available by invite only in India. Indian businesses cannot sign up directly and must request an invite, which isn't guaranteed. Beyond access, Stripe India only allows businesses to receive international payments via cards, limiting flexibility. It does not provide FIRA (Foreign Inward Remittance Advice), which is mandatory for Indian businesses receiving foreign payments.

Even if you get access, Stripe all-in runs near 6.3% for Indian businesses processing international payments. That's ₹1,890 lost on a ₹30,000 invoice.

**Verdict: Do not use Stripe as your primary gateway from India.**

---

### Use Razorpay — here's exactly why

You already know Razorpay. That matters more than people admit. Here's why it's the right call for every scenario you'll face:

**For Indian customers (your primary market initially):**
- UPI drives 60%+ of India's payments and Razorpay delivers 90%+ success rates. UPI Autopay, tokenized cards, and e-mandates are unified in one integration with built-in compliance.
- UPI Autopay handles recurring subscriptions — the default maximum amount per UPI mandate is ₹5,000 and for Netbanking mandate ₹1,000,000. Your Pro plan at ₹2,000/month fits comfortably within UPI AutoPay limits.

**For international customers:**
- Razorpay secured the PA-CB (Payment Aggregator: Cross Border) license from the RBI in December 2025, placing it among a select cohort of fintechs authorized for both inward and outward cross-border payments. Razorpay now holds all three RBI payment licenses: PA-O, PA-P, and PA-CB.
- This means Razorpay can legally accept international card payments and settle them into your Indian bank account. No invite process. No compliance gaps.

**For UPI mandate (recurring subscriptions):**
- RBI requires two compliance steps before any recurring charge: advance notification (72 hours before each renewal) and initial mandate authentication via OTP or UPI PIN. Razorpay handles mandate registration, card tokenization, and pre-debit notification workflows as built-in components.
- You don't have to build any of this yourself. Razorpay's Subscriptions product handles the full lifecycle.

---

### Razorpay Subscription Integration Plan

```typescript
// src/lib/razorpay.ts
import Razorpay from "razorpay";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Plan IDs — create these once in Razorpay dashboard
export const RAZORPAY_PLANS = {
  PRO_MONTHLY:    process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID!,
  PRO_ANNUAL:     process.env.RAZORPAY_PRO_ANNUAL_PLAN_ID!,
  AGENCY_MONTHLY: process.env.RAZORPAY_AGENCY_MONTHLY_PLAN_ID!,
  AGENCY_ANNUAL:  process.env.RAZORPAY_AGENCY_ANNUAL_PLAN_ID!,
} as const;
```

```typescript
// src/app/api/billing/subscribe/route.ts
export async function POST(req: NextRequest) {
  const { workspace, session } = await requireWorkspace();
  const { planKey } = await req.json();

  const planId = RAZORPAY_PLANS[planKey as keyof typeof RAZORPAY_PLANS];
  if (!planId) return apiError("INVALID_INPUT", "Invalid plan.");

  // Create subscription in Razorpay
  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: planKey.includes("ANNUAL") ? 1 : 12,
    quantity: 1,
    customer_notify: 1,
    notes: {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      userEmail: session.user.email,
    },
  });

  // Store pending subscription reference
  await prisma.razorpayCustomer.upsert({
    where: { workspaceId: workspace.id },
    update: { subscriptionId: subscription.id, subscriptionStatus: "created" },
    create: {
      workspaceId: workspace.id,
      subscriptionId: subscription.id,
      subscriptionStatus: "created",
    },
  });

  return apiSuccess({
    subscriptionId: subscription.id,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
```

```typescript
// src/app/api/billing/webhook/route.ts
// Verify Razorpay webhook signature and update workspace plan
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  if (signature !== expectedSig) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(body);

  switch (event.event) {
    case "subscription.activated":
      await handleSubscriptionActivated(event.payload.subscription.entity);
      break;
    case "subscription.charged":
      await handleSubscriptionCharged(event.payload.subscription.entity);
      break;
    case "subscription.cancelled":
    case "subscription.expired":
      await handleSubscriptionEnded(event.payload.subscription.entity);
      break;
    case "payment.failed":
      await handlePaymentFailed(event.payload.payment.entity);
      break;
  }

  return new Response("ok");
}

async function handleSubscriptionActivated(sub: RazorpaySubscription) {
  const { workspaceId } = sub.notes;
  const plan = getPlanFromPlanId(sub.plan_id); // map Razorpay plan ID to your Plan enum

  await prisma.$transaction([
    prisma.workspace.update({
      where: { id: workspaceId },
      data: { plan },
    }),
    prisma.razorpayCustomer.update({
      where: { workspaceId },
      data: {
        subscriptionId: sub.id,
        subscriptionStatus: "active",
        currentPeriodEnd: new Date(sub.current_end * 1000),
      },
    }),
  ]);
}
```

**Install:** `pnpm add razorpay`

---

### Schema update — replace StripeCustomer with RazorpayCustomer

```prisma
model RazorpayCustomer {
  id                  String    @id @default(cuid())
  workspaceId         String    @unique
  razorpayCustomerId  String?
  subscriptionId      String?   @unique
  planId              String?
  subscriptionStatus  String?   // "created" | "authenticated" | "active" | "paused" | "cancelled" | "expired"
  currentPeriodEnd    DateTime?
  cancelAtPeriodEnd   Boolean   @default(false)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}
```

---

### Pricing in INR vs USD

Price in INR for Indian customers, USD for international. Razorpay handles the conversion automatically.

```
HOBBY:  Free
PRO:    ₹1,999/month  (~$24)  or  ₹19,999/year (~$240, 17% off)
AGENCY: ₹6,499/month  (~$79)  or  ₹62,999/year (~$765, 20% off)
```

Show INR to Indian users (detect via browser locale or IP), USD on the public landing page. Razorpay's checkout supports multi-currency display natively.

---

## 2. Upstash — Is It Good Enough at Zero Cost?

**Yes. Definitively.**

### Redis (Rate Limiting)

Upstash's free tier offers Serverless Redis — 500K commands/month with 256MB data storage. Pricing is stable with no recorded changes.

Let's do the actual math for FlowCMS:

```
Each rate limit check = 2 Redis commands (GET + SET with sliding window)
500,000 commands/month ÷ 2 = 250,000 rate limit checks per month
250,000 ÷ 30 days = 8,333 API requests per day

For context:
- 100 Hobby users × 5 API calls/day = 500 checks/day
- 50 Pro users × 50 API calls/day = 2,500 checks/day
- Total at early stage: ~3,000 checks/day = well within free tier
```

You won't hit the free tier limit until you have significant traffic. By then you're generating revenue. The @upstash/ratelimit SDK is completely free — you only pay for the underlying database commands. Redis free tier allows up to 10,000 requests per day free, and beyond that just $0.20 per 100,000 requests.

**Verdict: Free tier is genuinely enough for the first 6–12 months.**

### QStash (Background Jobs)

QStash free tier: 1,000 messages/day.

Math for webhooks + usage increments:
```
Webhook fires: ~5 events per active user per day
50 active Pro users × 5 = 250 webhook messages/day
Usage increments: batched, not per-request (fire once per minute)
Total: ~300 messages/day
```

Well within the 1,000/day free limit. When you need to scale, QStash costs $1 per 100K messages. For an app handling 50K background jobs per month, that's $0.50.

**Verdict: Free tier covers you until you have a substantial paying user base.**

### What to do when you exceed free tier

```
Redis 500K/month exceeded:
  → Pay-as-you-go: $0.20 per 100K extra commands
  → At 1M commands/month (heavy usage): $1/month extra
  → Not a concern until you're generating real revenue

QStash 1,000/day exceeded:
  → $1 per 100K messages
  → 30,000 messages/month = $0.30
  → Not a concern until you have hundreds of active users
```

---

## 3. Admin Panel

### Decision: Fixed superadmin user, not a role

A role-based admin (`role: SUPERADMIN`) leaks admin logic into every permission check across the app. A fixed user ID checked at the middleware level is simpler, faster, and has zero attack surface from the user-facing codebase.

### Architecture

```typescript
// src/lib/admin.ts
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL!; // your email, set in .env

export function isAdmin(email: string): boolean {
  return email === ADMIN_EMAIL;
}

// src/middleware/with-admin.ts
import { requireSession } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await requireSession();
  if (!isAdmin(session.user.email)) {
    redirect("/dashboard"); // silently redirect, don't reveal admin exists
  }
  return session;
}
```

```env
# .env
ADMIN_EMAIL="kapil@yourdomain.com"
```

### Admin panel routes

```
/admin                    → overview: total users, workspaces, revenue MRR
/admin/workspaces         → all workspaces, plan, usage, last active
/admin/workspaces/[id]    → workspace detail, force plan change, impersonate
/admin/users              → all users, registration date, workspace
/admin/usage              → global API request volume chart
/admin/webhooks           → all webhook delivery logs (system-wide)
/admin/plans              → manual plan override for any workspace
/admin/announcements      → write a banner that appears in all dashboards
```

### Middleware guard

```typescript
// src/app/admin/layout.tsx
import { requireAdmin } from "@/middleware/with-admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin(); // redirects non-admins silently
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main>{children}</main>
    </div>
  );
}
```

### Admin-only features worth building

| Feature | Why it matters |
|---|---|
| Impersonate workspace | Debug user-reported issues without them sharing credentials |
| Force plan override | Manually grant Pro to a beta tester or influencer |
| Global usage chart | See if the system is being abused |
| System announcement | Push a banner to all dashboards ("Maintenance Saturday 2am") |
| Workspace deletion | Hard delete when a user can't log in but wants data removed (GDPR) |
| API request log viewer | See what endpoints are being hammered |

### Security notes

- The `/admin/*` routes should never appear in the landing page nav or any public link
- Add an extra layer: IP allowlist via Cloudflare (your home/office IP only) for `/admin/*`
- Never add an "Admin" option to the user menu — admin access is direct URL only
- Rotate `ADMIN_EMAIL` to a dedicated admin-only email, not your personal account

---

## 4. Documentation Plan

### Tech stack for docs

**Use [Fumadocs](https://fumadocs.vercel.app/) or [Nextra](https://nextra.site/).** Both are Next.js-native MDX documentation frameworks. Since your app is already on Next.js, you can host docs in the same repo at `/docs` or as a sub-path.

**Recommended: Fumadocs**
- Built for Next.js App Router (same as your app)
- MDX with syntax highlighting, callouts, tabs, code blocks out of the box
- Search with Orama (free, runs in-browser, no Algolia account needed)
- Can be mounted at `/docs` inside your existing Next.js app

```bash
pnpm add fumadocs-ui fumadocs-core fumadocs-mdx
```

Mount at `flowcms.kapiljangid.pro/docs` by adding:
```
src/app/docs/
  layout.tsx          ← Fumadocs layout
  page.tsx            ← redirect to /docs/introduction
  [[...slug]]/
    page.tsx          ← dynamic MDX rendering
content/docs/         ← all .mdx files live here
```

---

### Complete Documentation Structure

```
/docs
├── Getting Started
│   ├── Introduction
│   ├── Quick Start (5-minute guide)
│   ├── Core Concepts
│   └── FAQ
│
├── Content Modeling
│   ├── Content Types
│   ├── Field Types Reference
│   ├── Content Type Templates
│   └── Validations
│
├── Content Management
│   ├── Creating Entries
│   ├── Publishing Workflow (Draft → Published → Archived)
│   ├── Filtering & Searching
│   └── Bulk Actions
│
├── Page Builder
│   ├── Overview
│   ├── Block Reference
│   │   ├── Text Blocks (Heading, Text, Quote, Code, Callout)
│   │   ├── Media Blocks (Image, Video, Gallery, Embed)
│   │   ├── Layout Blocks (Columns, Spacer, Divider)
│   │   └── Interactive Blocks (CTA, Form, Accordion, Table)
│   ├── Page Templates
│   └── SEO Fields
│
├── REST API
│   ├── Authentication (API Keys)
│   ├── Endpoints Reference
│   │   ├── GET /v1/entries/{slug}
│   │   ├── GET /v1/entries/{slug}/{id}
│   │   ├── GET /v1/pages/{slug}
│   │   └── GET /v1/media
│   ├── Filtering & Pagination
│   ├── Response Format
│   ├── Error Codes
│   └── Rate Limits
│
├── Integrations
│   ├── Next.js (with code examples)
│   ├── React
│   ├── Plain JavaScript / fetch
│   ├── Draft Preview Setup
│   └── Webhooks
│
├── Media Library
│   ├── Uploading Files
│   ├── Supported Formats
│   └── Using Media in Content
│
├── Team & Workspace
│   ├── Inviting Members
│   ├── Roles & Permissions
│   └── Managing Your Workspace
│
├── Billing
│   ├── Plans & Limits
│   ├── Upgrading & Downgrading
│   └── FAQs
│
└── Self-Hosting (future)
    ├── Requirements
    ├── Environment Variables
    └── Deployment Guide
```

---

### Priority pages to write first

Write these 6 pages before launching. Everything else can be added post-launch.

#### 1. Quick Start (most important page in any doc site)

```mdx
---
title: Quick Start
description: Get your first content type and API response in 5 minutes
---

## 1. Create a content type

After signing up, click **New Content Type** in the sidebar.
Name it "Blog Post" and add these fields:

| Field | Type | Required |
|-------|------|----------|
| title | Text | Yes |
| slug | Text | Yes |
| body | Rich Text | No |

Click **Save**.

## 2. Create an entry

Go to **Blog Post → Entries → New Entry**.
Fill in the title and slug, then click **Publish**.

## 3. Get your API key

Go to **Settings → API Keys → New Key**.
Copy the key — it starts with `flw_`.

## 4. Fetch your content

\`\`\`bash
curl https://flowcms.kapiljangid.pro/api/v1/entries/blog-post \
  -H "Authorization: Bearer flw_your_key_here"
\`\`\`

Response:
\`\`\`json
{
  "data": [
    {
      "id": "clx...",
      "data": { "title": "Hello World", "slug": "hello-world" },
      "status": "PUBLISHED",
      "publishedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "meta": { "total": 1, "page": 1, "perPage": 20 }
}
\`\`\`

That's it. Your content is live.
```

#### 2. Next.js Integration

```mdx
---
title: Next.js Integration
description: Fetch FlowCMS content in your Next.js app
---

## Installation

No SDK needed — FlowCMS uses standard HTTP. Use fetch directly.

\`\`\`typescript
// lib/cms.ts
const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? "https://flowcms.kapiljangid.pro";
const CMS_KEY = process.env.CMS_API_KEY!;

export async function getEntries(contentType: string) {
  const res = await fetch(`${CMS_URL}/api/v1/entries/${contentType}`, {
    headers: { Authorization: `Bearer ${CMS_KEY}` },
    next: { revalidate: 60 }, // ISR — revalidate every 60 seconds
  });
  if (!res.ok) throw new Error(`CMS error: ${res.status}`);
  return res.json();
}
\`\`\`

## Fetch on the server (recommended)

\`\`\`typescript
// app/blog/page.tsx
import { getEntries } from "@/lib/cms";

export default async function BlogPage() {
  const { data: posts } = await getEntries("blog-post");
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.data.title}</li>
      ))}
    </ul>
  );
}
\`\`\`

## Draft preview

Add a draft token in your CMS dashboard (**Settings → Draft Tokens**),
then pass it as a query param:

\`\`\`typescript
const isDraft = process.env.NODE_ENV === "development";
const url = `${CMS_URL}/api/v1/entries/blog-post${isDraft ? `?_token=${process.env.CMS_DRAFT_TOKEN}` : ""}`;
\`\`\`
```

#### 3. API Reference (single-page, all endpoints)

Describe every endpoint with request/response examples and error codes.
Use `<Tabs>` for code examples in multiple languages (curl, fetch, axios).

#### 4. Webhooks

Explain: how to configure, the event list, how to verify the HMAC signature, and how to handle delivery failures.

#### 5. Field Types Reference

A table describing every field type, its JSON representation in the API response, and validation options.

#### 6. Rate Limits

Explain per-plan limits, the response headers (`X-RateLimit-Limit`, etc.), and what the 429 response looks like.

---

### Doc site configuration

```typescript
// src/app/docs/layout.tsx
import { DocsLayout } from "fumadocs-ui/layout";
import { APP_CONFIG } from "@/config/app.config";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DocsLayout
      tree={/* your page tree */}
      nav={{
        title: APP_CONFIG.name,
        url: "/",
      }}
      sidebar={{
        defaultOpenLevel: 1,
      }}
    >
      {children}
    </DocsLayout>
  );
}
```

### SEO for docs

Each MDX file should have frontmatter:
```mdx
---
title: Getting Started with FlowCMS
description: Learn how to set up FlowCMS and make your first API call in under 5 minutes
---
```

The page title becomes `Getting Started with FlowCMS | FlowCMS Docs` automatically.
Good doc SEO is how developers discover you via "how to fetch CMS content in Next.js" searches.

---

## 5. Summary — Decision Table

| Question | Decision | Reason |
|---|---|---|
| Payment gateway | **Razorpay** | You know it, India-first, UPI AutoPay, international via PA-CB license, no invite process |
| Pricing currency | **INR for Indian users, USD for international** | Razorpay handles conversion |
| UPI subscriptions | **Razorpay Subscriptions** | Built-in mandate, 90%+ success rate, RBI compliant |
| Rate limiting | **Upstash Redis free tier** | 500K commands/month free, HTTP-compatible with Vercel edge |
| Background jobs | **Upstash QStash free tier** | 1,000 messages/day free, covers webhooks + usage tracking at early stage |
| Cost at launch | **$0/month** | Both Upstash products free until meaningful scale |
| Admin panel access | **Fixed email env var, not a role** | Simpler, more secure, no attack surface |
| Admin URL | **/admin, guarded by middleware + Cloudflare IP rule** | Never linked publicly |
| Docs framework | **Fumadocs in same Next.js repo** | No extra deploy, same domain, App Router native |
| Docs URL | **flowcms.kapiljangid.pro/docs** | Works with CNAME setup, no extra cost |
| First docs to write | **Quick Start, Next.js guide, API reference, Webhooks, Field Types, Rate Limits** | These answer the questions every new user has |

---

*Decision Guide v1.0 — FlowCMS*