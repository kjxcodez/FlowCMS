# FlowCMS — Complete Product Guide
## Features, Schema Extensions, Business Model & Infrastructure Roadmap

> Based on the full audit report, competitive research, and current schema.
> This document is the single source of truth for what to build, why to build it, and how to charge for it.

---

## Part 1 — Market Position & Honest Assessment

### Where FlowCMS Sits

The headless CMS market has split into two camps:

**Camp A — Developer Frameworks** (Strapi, Payload CMS)
- Open source, self-hosted, free software + paid cloud
- Own your data, own the stack
- Developer is the primary user

**Camp B — Enterprise Orchestrators** (Contentful, Sanity, Hygraph)
- Proprietary SaaS, usage-based pricing, $300–$1,500/mo at scale
- Marketing teams are the primary user
- AI features, real-time collab, global CDN

**FlowCMS's gap:** Neither camp serves the *indie developer building a SaaS* or *small agency managing 10 client sites* well. Strapi requires a $20/month VPS and DevOps knowledge. Contentful charges $300/month before you have real traffic. Sanity is excellent but GROQ is a proprietary query language with a learning curve.

**FlowCMS's actual positioning:**
> The headless CMS for developers who want Sanity-quality DX at Strapi-level pricing, with zero infrastructure to manage.

Your differentiator is not features — it is **simplicity + price + a beautiful editor**. You're targeting:
1. Indie developers building client sites (they need a white-label CMS to hand off)
2. Solo founders with a blog/marketing site who outgrew Notion but can't afford Contentful
3. Small dev agencies managing multiple client workspaces under one account

---

## Part 2 — Business Model

### Pricing Architecture

The audit correctly identifies that the current $0 / $19 / $79 structure is reasonable but needs tuning. Here's the revised model based on market research:

```
HOBBY — Free forever
  3 content types
  5,000 API requests/month
  1 workspace
  1 environment (no staging)
  Community support
  FlowCMS branding on API responses (X-Powered-By header)
  No webhooks
  No custom domains for API

PRO — $24/month (or $19/month billed annually = 20% discount)
  Unlimited content types
  250,000 API requests/month
  1 workspace
  3 environments (prod + staging + dev)
  Webhooks (up to 5 endpoints)
  Custom domain for API (api.yourdomain.com)
  Remove FlowCMS branding
  Email support (48hr SLA)
  Draft preview tokens
  7-day usage history

AGENCY — $79/month (or $65/month billed annually)
  Everything in Pro
  5 workspaces (manage client sites separately)
  1,000,000 API requests/month (pooled across workspaces)
  10 webhook endpoints
  Team members (up to 5 seats)
  White-label dashboard (your logo, your domain)
  Priority support (12hr SLA)
  30-day usage history
  Audit logs

ENTERPRISE — Custom pricing (minimum ~$300/month)
  Unlimited workspaces
  Unlimited API requests
  SSO (SAML/OIDC)
  Custom roles & permissions
  SLA (99.9% uptime)
  GDPR data processing agreement
  SOC2 report (when achieved)
  Dedicated Slack channel
  Quarterly review calls
```

### Why This Pricing Works

- **Hobby is genuinely usable** — 5,000 requests/month is enough for a real blog with moderate traffic. This drives word-of-mouth.
- **Pro at $24 is an easy yes** — it's below the "is this worth thinking about" threshold for any employed developer.
- **Agency at $79 unlocks the real revenue** — agencies with 5 client sites pay $79 instead of $79×5 = $395 across separate tools. This feels like a steal for them.
- **Annual discount drives cash flow** — 20% off locks in 12 months of runway.
- **White-label is an agency's dream** — they resell access to clients at $50+/month per site and pocket the margin.

### Revenue Model Beyond Subscriptions

| Revenue Stream | Description | When to Launch |
|---|---|---|
| Overage billing | $0.002 per API request beyond plan limit | Month 3 |
| Seat expansion | $12/seat beyond plan limit | Month 4 |
| Priority support addon | $49/month for guaranteed 4hr response | Month 6 |
| AI credits | $10 for 100 AI content generations | Month 8 |
| Starter templates | Free with attribution, $9 premium templates | Month 6 |
| Marketplace revenue share | 30% of revenue from community block plugins | Year 2 |

---

## Part 3 — Schema Extensions

### New Models to Add

#### 3.1 — `Environment` model

Currently there is no concept of environments. This is table stakes for any serious CMS use case.

```prisma
model Environment {
  id          String   @id @default(cuid())
  workspaceId String
  name        String   // "Production", "Staging", "Development"
  slug        String   // "production", "staging", "dev"
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())

  workspace   Workspace  @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  apiKeys     ApiKey[]   // Keys scoped to specific environments
  entries     Entry[]
  pages       Page[]

  @@unique([workspaceId, slug])
}
```

Update `Entry`, `Page`, `ApiKey` to add:
```prisma
environmentId String?
environment   Environment? @relation(...)
```

#### 3.2 — `AuditLog` model

Critical for compliance and debugging. "Who changed what and when."

```prisma
model AuditLog {
  id          String   @id @default(cuid())
  workspaceId String
  userId      String?
  apiKeyId    String?
  action      AuditAction
  resourceType String  // "ContentType", "Entry", "Page", "ApiKey", "Webhook"
  resourceId   String
  resourceName String? // human-readable name for display
  before      Json?    // snapshot before change
  after       Json?    // snapshot after change
  ip          String?
  userAgent   String?
  createdAt   DateTime @default(now())

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId, createdAt])
  @@index([workspaceId, resourceType, resourceId])
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  PUBLISH
  UNPUBLISH
  ARCHIVE
  API_KEY_CREATED
  API_KEY_REVOKED
  WEBHOOK_FIRED
  MEMBER_INVITED
  MEMBER_REMOVED
  PLAN_CHANGED
}
```

#### 3.3 — `Invitation` model

Without this, the WorkspaceMember table is useless. You cannot invite team members without email invitations.

```prisma
model Invitation {
  id          String           @id @default(cuid())
  workspaceId String
  email       String
  role        MemberRole       @default(EDITOR)
  token       String           @unique  // secure random token for the invite link
  status      InvitationStatus @default(PENDING)
  invitedById String
  expiresAt   DateTime         // 7 days from creation
  acceptedAt  DateTime?
  createdAt   DateTime         @default(now())

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, email])
  @@index([token])
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  EXPIRED
  REVOKED
}
```

#### 3.4 — `ContentTypeTemplate` model

Pre-built schemas users can clone into their workspace. Key for onboarding conversion.

```prisma
model ContentTypeTemplate {
  id          String   @id @default(cuid())
  name        String   // "Blog Post", "Product", "FAQ", "Event"
  slug        String   @unique
  description String
  category    String   // "Blog", "E-commerce", "Marketing", "Documentation"
  fields      Json     // Same FieldDefinition[] shape as ContentType.fields
  previewData Json?    // Sample entry data to show in onboarding
  isPremium   Boolean  @default(false)
  usageCount  Int      @default(0)
  createdAt   DateTime @default(now())
}
```

#### 3.5 — `PageTemplate` model

Pre-built block arrangements. Editors can start from a template instead of an empty canvas.

```prisma
model PageTemplate {
  id          String   @id @default(cuid())
  name        String   // "Landing Page", "About Us", "Blog Post Layout"
  slug        String   @unique
  description String
  category    String
  blocks      Json     // Array of Block objects with default props
  thumbnail   String?  // URL to preview image
  isPremium   Boolean  @default(false)
  usageCount  Int      @default(0)
  createdAt   DateTime @default(now())
}
```

#### 3.6 — `StripeCustomer` model

Required for billing. Do not add Stripe customer IDs to the Workspace model directly — keep billing concerns isolated.

```prisma
model StripeCustomer {
  id                   String    @id @default(cuid())
  workspaceId          String    @unique
  stripeCustomerId     String    @unique
  stripeSubscriptionId String?
  stripePriceId        String?
  subscriptionStatus   String?   // "active", "canceled", "past_due", "trialing"
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean   @default(false)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}
```

#### 3.7 — `DraftToken` model

Live preview tokens. Developers add `?_token=abc123` to their Next.js app to preview unpublished content. This is one of the highest-conversion features you can ship.

```prisma
model DraftToken {
  id          String    @id @default(cuid())
  workspaceId String
  name        String    // "Next.js Preview Mode", "Staging Site"
  token       String    @unique
  expiresAt   DateTime? // null = never expires
  lastUsedAt  DateTime?
  createdAt   DateTime  @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}
```

#### 3.8 — `CustomDomain` model

API custom domains (api.yourclient.com → flowcms API). Agency plan feature.

```prisma
model CustomDomain {
  id          String   @id @default(cuid())
  workspaceId String
  domain      String   @unique  // e.g. "api.yourclient.com"
  verified    Boolean  @default(false)
  verifyToken String   // TXT record value for DNS verification
  createdAt   DateTime @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}
```

#### 3.9 — Update `Workspace` with billing fields

```prisma
model Workspace {
  // ... existing fields ...

  // Add these:
  stripeCustomer  StripeCustomer?
  environments    Environment[]
  auditLogs       AuditLog[]
  invitations     Invitation[]
  draftTokens     DraftToken[]
  customDomains   CustomDomain[]

  // Billing convenience fields (mirror from Stripe, updated via webhook)
  planExpiresAt   DateTime?
  trialEndsAt     DateTime?
}
```

#### 3.10 — Update Existing Models

**`Entry` — add environment and version support:**
```prisma
model Entry {
  // ... existing fields ...
  environmentId String?
  environment   Environment? @relation(...)
  version       Int      @default(1)  // incremented on each save
  localeCode    String?  @default("en")  // for future i18n
}
```

**`Page` — add environment and SEO fields:**
```prisma
model Page {
  // ... existing fields ...
  environmentId   String?
  environment     Environment? @relation(...)
  ogImage         String?  // Open Graph image URL
  canonicalUrl    String?
  noIndex         Boolean @default(false)
  localeCode      String? @default("en")
}
```

**`ApiKey` — scope to environment:**
```prisma
model ApiKey {
  // ... existing fields ...
  environmentId String?
  environment   Environment? @relation(...)
  scopes        String[]  // ["read:entries", "read:pages", "read:media"] — for future fine-grained permissions
}
```

---

## Part 4 — New Blocks to Implement

### Current blocks: Heading, Text, Image, CTA, Divider
### Add these 12 blocks:

| Block | Props | Use case |
|---|---|---|
| `quote` | `text`, `author`, `role`, `avatar` | Testimonials, pull quotes |
| `code` | `language`, `code`, `filename`, `showLineNumbers` | Developer documentation |
| `video` | `url`, `provider` (youtube/vimeo/upload), `autoplay`, `caption` | Product demos |
| `gallery` | `images[]` (url, alt, caption), `layout` (grid/masonry/carousel) | Portfolio, product images |
| `embed` | `url`, `type` (tweet/codepen/figma/youtube), `height` | Social embeds |
| `form` | `formId`, `fields[]`, `submitLabel`, `successMessage` | Contact, newsletter signup |
| `columns` | `columnCount` (2/3), `gap`, `blocks[][]` | Multi-column layouts |
| `accordion` | `items[]` (question, answer), `allowMultiple` | FAQ sections |
| `table` | `headers[]`, `rows[][]`, `caption`, `striped` | Comparison tables, data |
| `callout` | `type` (info/warning/danger/success), `title`, `body` | Docs alerts, notices |
| `spacer` | `height` (sm/md/lg/xl) | Vertical breathing room |
| `html` | `content` (raw HTML string) | Advanced escape hatch |

### Block taxonomy

Group blocks in the palette into categories:

```
Text         — Heading, Text, Quote, Code, Callout, HTML
Media        — Image, Video, Gallery, Embed
Layout       — Columns, Spacer, Divider
Interactive  — CTA, Form, Accordion, Table
```

---

## Part 5 — Content Type Templates

Ship these 12 templates on day one. They appear in the "New Content Type" modal.

### Category: Blog & Publishing
```json
{
  "name": "Blog Post",
  "slug": "blog-post",
  "fields": [
    { "name": "Title", "slug": "title", "type": "text", "required": true },
    { "name": "Slug", "slug": "slug", "type": "text", "required": true },
    { "name": "Author", "slug": "author", "type": "text", "required": true },
    { "name": "Cover Image", "slug": "cover_image", "type": "media", "required": false },
    { "name": "Excerpt", "slug": "excerpt", "type": "textarea", "required": false },
    { "name": "Body", "slug": "body", "type": "richtext", "required": true },
    { "name": "Tags", "slug": "tags", "type": "text", "multiple": true },
    { "name": "SEO Title", "slug": "seo_title", "type": "text", "required": false },
    { "name": "SEO Description", "slug": "seo_description", "type": "textarea", "required": false }
  ]
}
```

```json
{ "name": "Author", "slug": "author",
  "fields": ["name", "bio (textarea)", "avatar (media)", "twitter", "website"] }
```

### Category: E-commerce
```json
{ "name": "Product", "slug": "product",
  "fields": ["name", "slug", "description (richtext)", "price (number)", "comparePrice (number)",
             "images (media, multiple)", "sku", "inStock (boolean)", "category", "tags (multiple)"] }
```

```json
{ "name": "Product Category", "slug": "product-category",
  "fields": ["name", "slug", "description", "image (media)", "parentCategory (reference)"] }
```

### Category: Marketing
```json
{ "name": "Landing Page Section", "slug": "landing-section",
  "fields": ["heading", "subheading", "body (richtext)", "ctaLabel", "ctaUrl",
             "image (media)", "imagePosition (text)", "backgroundColor"] }
```

```json
{ "name": "Testimonial", "slug": "testimonial",
  "fields": ["quote (textarea)", "author", "role", "company", "avatar (media)", "rating (number)"] }
```

```json
{ "name": "FAQ", "slug": "faq",
  "fields": ["question", "answer (richtext)", "category", "order (number)"] }
```

### Category: Documentation
```json
{ "name": "Doc Page", "slug": "doc-page",
  "fields": ["title", "slug", "body (richtext)", "category", "order (number)",
             "lastUpdated (date)", "contributors (text, multiple)"] }
```

### Category: Team / Company
```json
{ "name": "Team Member", "slug": "team-member",
  "fields": ["name", "role", "bio (textarea)", "photo (media)", "email",
             "linkedin", "github", "order (number)"] }
```

```json
{ "name": "Job Opening", "slug": "job-opening",
  "fields": ["title", "department", "location", "type (text)", "description (richtext)",
             "requirements (richtext)", "salary", "applyUrl", "closingDate (date)"] }
```

```json
{ "name": "Case Study", "slug": "case-study",
  "fields": ["title", "client", "industry", "challenge (richtext)", "solution (richtext)",
             "results (richtext)", "coverImage (media)", "images (media, multiple)", "publishedDate (date)"] }
```

```json
{ "name": "Event", "slug": "event",
  "fields": ["title", "slug", "description (richtext)", "startDate (date)", "endDate (date)",
             "location", "isOnline (boolean)", "registrationUrl", "coverImage (media)", "capacity (number)"] }
```

---

## Part 6 — Page Templates

Ship these 6 page templates in the block editor:

### 1. Blog Post Layout
```
[Heading — H1 — "Post Title"]
[Text — "Author • Date • Reading time"]
[Image — cover image, full width]
[Text — "Post body goes here..."]
[Divider]
[Heading — H2 — "Related Posts"]
```

### 2. Landing Page
```
[Heading — H1 — "Your headline"]
[Text — "Supporting subheadline"]
[CTA — "Get started" / "Learn more"]
[Divider]
[Columns — 3 cols]
  [Heading H3 + Text] [Heading H3 + Text] [Heading H3 + Text]
[Image — product screenshot]
[Quote — testimonial]
[CTA — "Start free trial"]
```

### 3. About Page
```
[Heading — H1 — "About Us"]
[Text — company story]
[Image — team photo]
[Heading — H2 — "Our Mission"]
[Text — mission statement]
[Heading — H2 — "The Team"]
[Gallery — team photos]
```

### 4. Contact Page
```
[Heading — H1 — "Get in Touch"]
[Columns — 2 cols]
  [Text — contact info, address, email]
  [Form — name, email, message, submit]
```

### 5. Documentation Article
```
[Heading — H1 — "Article Title"]
[Callout — type: info — "Quick summary"]
[Text — introduction]
[Heading — H2 — "Section"]
[Text — section body]
[Code — language: typescript]
[Callout — type: warning — "Note"]
```

### 6. Product Page
```
[Columns — 2 cols]
  [Gallery — product images]
  [Heading H1 + Text (price) + Text (description) + CTA]
[Divider]
[Accordion — FAQ items]
[Heading — H2 — "Related Products"]
```

---

## Part 7 — Infrastructure Hardening Roadmap

The audit is correct: the current stack will break under real traffic. Here's the exact fix order.

### Week 1 — Critical (Do Before Any Marketing)

#### 7.1 — Upstash Redis Rate Limiter

Replace the in-memory Map with Upstash Redis. Free tier covers 10,000 commands/day, which is plenty for early users.

```typescript
// src/lib/rate-limit.ts — replace entirely
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Sliding window — fairer than fixed window
export const rateLimiters = {
  HOBBY: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "1 m"), prefix: "rl:hobby" }),
  PRO:   new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(300, "1 m"), prefix: "rl:pro" }),
  TEAM:  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(1000, "1 m"), prefix: "rl:team" }),
};

export async function checkRateLimit(workspaceId: string, plan: string) {
  const limiter = rateLimiters[plan as keyof typeof rateLimiters] ?? rateLimiters.HOBBY;
  const { success, limit, remaining, reset } = await limiter.limit(workspaceId);
  return { allowed: success, limit, remaining, resetAt: reset };
}
```

Install: `pnpm add @upstash/redis @upstash/ratelimit`

Cost: $0 until 10K commands/day. Well within Hobby usage.

#### 7.2 — Supabase Connection Pooler

In your `.env`, switch to the pooled connection string:

```env
# Change from direct (port 5432) to Transaction Pooler (port 6543)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

This single change prevents the "too many connections" crash under concurrent load. Takes 2 minutes.

#### 7.3 — Stripe Integration (Revenue Switch)

```
pnpm add stripe @stripe/stripe-js
```

New files needed:
- `src/lib/stripe.ts` — Stripe client singleton
- `src/app/api/stripe/checkout/route.ts` — create checkout session
- `src/app/api/stripe/portal/route.ts` — customer portal (manage subscription)
- `src/app/api/stripe/webhook/route.ts` — handle subscription events
- `src/app/(dashboard)/dashboard/settings/billing/page.tsx` — billing UI

Stripe webhook events to handle:
```
checkout.session.completed     → set workspace.plan, create StripeCustomer record
customer.subscription.updated  → update plan if user upgrades/downgrades
customer.subscription.deleted  → downgrade to HOBBY
invoice.payment_failed         → email user, set warning in dashboard
```

### Week 2 — Stability

#### 7.4 — Upstash QStash for Background Jobs

Move webhooks and usage increment out of the request cycle:

```typescript
// src/lib/queue.ts
import { Client } from "@upstash/qstash";

export const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

export async function enqueueWebhook(payload: {
  workspaceId: string;
  event: string;
  data: Record<string, unknown>;
}) {
  await qstash.publishJSON({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/jobs/webhook`,
    body: payload,
    retries: 3,
  });
}

export async function enqueueUsageIncrement(workspaceId: string) {
  await qstash.publishJSON({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/jobs/usage`,
    body: { workspaceId },
    retries: 2,
  });
}
```

Job handlers at `src/app/api/jobs/webhook/route.ts` and `src/app/api/jobs/usage/route.ts`:
- Verify QStash signature with `@upstash/qstash` receiver
- Execute the actual DB work
- Return 200 on success, non-2xx to trigger retry

Cost: Free tier 500 messages/day. Paid $1/100K messages. Webhooks for 100 Pro customers firing 5 events/day = 500 messages/day = within free tier.

#### 7.5 — Sentry Error Tracking

```
pnpm add @sentry/nextjs
```

5 minutes of setup. Catches every silent error in fire-and-forget handlers. This alone is worth a Sprint. Free tier is 5,000 errors/month — more than enough.

```typescript
// Wrap all internal route handlers
import * as Sentry from "@sentry/nextjs";

export async function GET() {
  try {
    // ... handler logic
  } catch (error) {
    Sentry.captureException(error, { extra: { workspaceId, endpoint } });
    return apiError("INTERNAL_ERROR", "Something went wrong.");
  }
}
```

### Week 3-4 — Product Completeness

#### 7.6 — Workspace Settings Page

Complete the "Coming Soon" placeholder with:
- Rename workspace
- Change plan (links to Stripe customer portal)
- Danger zone: delete workspace (with confirmation + `DELETE /me/data` endpoint for GDPR)
- Team members list + invite form
- Webhook configuration (already in schema, needs UI)

#### 7.7 — Real Usage Analytics

Connect `UsageLog` to the dashboard UI:

```sql
-- Query for usage chart (last 30 days, grouped by day)
SELECT
  DATE_TRUNC('day', "createdAt") as date,
  COUNT(*) as requests,
  AVG(duration) as avg_latency,
  COUNT(*) FILTER (WHERE "statusCode" >= 400) as errors
FROM "UsageLog"
WHERE "workspaceId" = $1
  AND "createdAt" > NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1
```

Use Recharts (already available in React) to render a simple line chart. This transforms the "decorative" usage page into a genuine product feature users care about.

#### 7.8 — Live Preview via Draft Tokens

The single highest-impact feature for developer adoption. When a developer adds `?_token=abc123` to their Next.js fetch call, your API returns draft content instead of only published content.

```typescript
// In GET /api/v1/entries/[slug]/route.ts
// Add after API key verification:

const draftToken = req.nextUrl.searchParams.get("_token");
if (draftToken) {
  const token = await prisma.draftToken.findUnique({
    where: { token: draftToken, workspaceId },
  });
  if (token && (!token.expiresAt || token.expiresAt > new Date())) {
    // Return draft content
    where.status = undefined; // remove published-only filter
  }
}
```

This enables the "Preview" button in the editor to actually work. Without it, the preview button is the single biggest feature gap between you and Sanity/Contentful.

---

## Part 8 — Features Priority Matrix

### Must ship before charging anyone (MVP gate):

| Feature | Effort | Impact |
|---|---|---|
| Stripe + billing | 3 days | Revenue on/off switch |
| Upstash Redis rate limiter | 2 hours | Prevents production crash |
| Connection pooler | 10 minutes | Prevents DB crash |
| Workspace settings page | 2 days | Users can't manage their account |
| Real usage analytics | 1 day | "Usage" page currently fake |

### Ship in first paid month:

| Feature | Effort | Impact |
|---|---|---|
| Team member invitations | 2 days | CMS without a team is a blog |
| Live preview + draft tokens | 1 day | Highest dev-satisfaction feature |
| Environments (staging/prod) | 3 days | Unlocks Agency plan value prop |
| Audit logs | 1 day | Required for any team plan |
| QStash background jobs | 1 day | Webhook reliability |
| Sentry | 2 hours | Stop flying blind |

### Ship in months 2-3:

| Feature | Effort | Impact |
|---|---|---|
| Content type templates | 2 days | Dramatically improves onboarding |
| Page templates | 2 days | Block editor adoption |
| New blocks (12 listed above) | 3 days | Editor completeness |
| AI SEO assist | 3 days | PRO plan differentiation |
| Custom domain for API | 2 days | Agency plan key feature |
| GraphQL endpoint | 5 days | Opens enterprise market |

### Ship in months 4-6:

| Feature | Effort | Impact |
|---|---|---|
| White-label dashboard | 3 days | Agency plan lock-in |
| i18n / locale support | 5 days | European market |
| Image transformations | 2 days | Removes Cloudinary dependency |
| SSO (SAML) | 5 days | Enterprise gate |
| Block marketplace | 2 weeks | Ecosystem flywheel |

---

## Part 9 — AI Features Roadmap

AI is table stakes in 2025 for any developer tool. But build it as utility, not theater.

### AI Feature 1 — SEO Metadata Generator (Ship first)

On the entry edit page, add a "Generate with AI" button next to SEO Title and SEO Description fields.

```typescript
// src/app/api/internal/ai/seo/route.ts
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const { title, content, contentType } = await req.json();
  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-haiku-4-5",  // haiku = cheap, fast, good enough for this
    max_tokens: 256,
    messages: [{
      role: "user",
      content: `Generate SEO metadata for this ${contentType} content.
Title: ${title}
Content preview: ${content.slice(0, 500)}

Respond with JSON only:
{ "seoTitle": "...", "seoDescription": "..." }

Rules: seoTitle max 60 chars, seoDescription max 155 chars, include primary keyword naturally.`
    }]
  });

  return apiSuccess(JSON.parse(message.content[0].text));
}
```

**Pricing:** Haiku costs $0.00025/1K input tokens. A typical generation costs < $0.001. Charge 1 AI credit per generation. Sell 100 credits for $10. Margin: ~98%.

### AI Feature 2 — Content Type Generator

Most powerful onboarding feature. User types "I'm building an e-commerce site that sells handmade pottery" → AI generates the full content type schema.

```typescript
// Prompt:
`You are a CMS schema designer. Based on the user's description, generate a JSON content type schema.

User description: "${userDescription}"

Output ONLY valid JSON matching this TypeScript type:
{ name: string, slug: string, description: string, fields: FieldDefinition[] }

Rules:
- slug is kebab-case, no spaces
- Include 5-10 fields appropriate for this content type
- Always include: title/name (text, required), slug (text, required)
- Use richtext only for long body content
- Use media type for image fields
- Include SEO fields (seoTitle, seoDescription) if appropriate`
```

### AI Feature 3 — Content Suggestions (Ship later)

On the entry editor, while the user is typing, offer:
- "Complete this sentence"
- "Make this more concise"
- "Translate to [language]"
- "Generate 3 alternative headlines"

This is Notion AI, but scoped to structured CMS content. Gate it behind Pro plan.

---

## Part 10 — Full Revised Schema (Final)

Here is the complete `schema.prisma` with all additions:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
  output          = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// ── Auth ───────────────────────────────────────────────────────────
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  emailVerified Boolean  @default(false)
  onboarded     Boolean  @default(false)
  image         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  sessions         Session[]
  accounts         Account[]
  workspaceMembers WorkspaceMember[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                    String    @id @default(cuid())
  userId                String
  accountId             String
  providerId            String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

// ── Workspace ──────────────────────────────────────────────────────
model Workspace {
  id            String    @id @default(cuid())
  name          String
  slug          String    @unique
  plan          Plan      @default(HOBBY)
  planExpiresAt DateTime?
  trialEndsAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  members        WorkspaceMember[]
  environments   Environment[]
  contentTypes   ContentType[]
  pages          Page[]
  media          Media[]
  apiKeys        ApiKey[]
  webhooks       Webhook[]
  usageLogs      UsageLog[]
  monthlyUsage   MonthlyUsage[]
  auditLogs      AuditLog[]
  invitations    Invitation[]
  draftTokens    DraftToken[]
  customDomains  CustomDomain[]
  stripeCustomer StripeCustomer?
}

model WorkspaceMember {
  id          String     @id @default(cuid())
  workspaceId String
  userId      String
  role        MemberRole @default(EDITOR)
  createdAt   DateTime   @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])
}

// ── Environments ───────────────────────────────────────────────────
model Environment {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  slug        String
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  apiKeys   ApiKey[]
  entries   Entry[]
  pages     Page[]

  @@unique([workspaceId, slug])
}

// ── Content ────────────────────────────────────────────────────────
model ContentType {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  slug        String
  description String?
  fields      Json
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  entries   Entry[]

  @@unique([workspaceId, slug])
}

model Entry {
  id            String      @id @default(cuid())
  contentTypeId String
  workspaceId   String
  environmentId String?
  data          Json
  status        EntryStatus @default(DRAFT)
  version       Int         @default(1)
  localeCode    String?     @default("en")
  publishedAt   DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  contentType ContentType  @relation(fields: [contentTypeId], references: [id], onDelete: Cascade)
  environment Environment? @relation(fields: [environmentId], references: [id])

  @@index([workspaceId, status])
  @@index([contentTypeId, status])
}

model Page {
  id            String      @id @default(cuid())
  workspaceId   String
  environmentId String?
  title         String
  slug          String
  blocks        Json
  status        EntryStatus @default(DRAFT)
  publishedAt   DateTime?
  seoTitle      String?
  seoDesc       String?
  ogImage       String?
  canonicalUrl  String?
  noIndex       Boolean     @default(false)
  localeCode    String?     @default("en")
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  workspace   Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  environment Environment? @relation(fields: [environmentId], references: [id])

  @@unique([workspaceId, slug])
}

// ── Media ──────────────────────────────────────────────────────────
model Media {
  id          String   @id @default(cuid())
  workspaceId String
  filename    String
  url         String
  mimeType    String
  size        Int
  alt         String?
  width       Int?
  height      Int?
  folder      String?  @default("/")
  createdAt   DateTime @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId, folder])
}

// ── API Keys ───────────────────────────────────────────────────────
model ApiKey {
  id            String    @id @default(cuid())
  workspaceId   String
  environmentId String?
  name          String
  keyHash       String    @unique
  keyPrefix     String
  scopes        String[]  @default(["read:entries", "read:pages", "read:media"])
  lastUsedAt    DateTime?
  expiresAt     DateTime?
  createdAt     DateTime  @default(now())

  workspace   Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  environment Environment? @relation(fields: [environmentId], references: [id])
}

// ── Webhooks ───────────────────────────────────────────────────────
model Webhook {
  id          String         @id @default(cuid())
  workspaceId String
  url         String
  events      WebhookEvent[]
  secret      String
  enabled     Boolean        @default(true)
  createdAt   DateTime       @default(now())

  workspace  Workspace         @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  deliveries WebhookDelivery[]
}

model WebhookDelivery {
  id         String   @id @default(cuid())
  webhookId  String
  event      String
  payload    Json
  statusCode Int?
  success    Boolean
  duration   Int?
  createdAt  DateTime @default(now())

  webhook Webhook @relation(fields: [webhookId], references: [id], onDelete: Cascade)
}

// ── Observability ──────────────────────────────────────────────────
model UsageLog {
  id          String   @id @default(cuid())
  workspaceId String
  apiKeyId    String?
  endpoint    String
  method      String
  statusCode  Int
  duration    Int
  ip          String?
  userAgent   String?
  cacheHit    Boolean  @default(false)
  createdAt   DateTime @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId, createdAt])
  @@index([workspaceId, apiKeyId])
}

model MonthlyUsage {
  id           String   @id @default(cuid())
  workspaceId  String
  year         Int
  month        Int
  apiRequests  Int      @default(0)
  storageBytes Int      @default(0)
  contentTypes Int      @default(0)
  updatedAt    DateTime @updatedAt

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, year, month])
}

model AuditLog {
  id           String      @id @default(cuid())
  workspaceId  String
  userId       String?
  apiKeyId     String?
  action       AuditAction
  resourceType String
  resourceId   String
  resourceName String?
  before       Json?
  after        Json?
  ip           String?
  userAgent    String?
  createdAt    DateTime    @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId, createdAt])
  @@index([workspaceId, resourceType, resourceId])
}

// ── Billing ────────────────────────────────────────────────────────
model StripeCustomer {
  id                   String    @id @default(cuid())
  workspaceId          String    @unique
  stripeCustomerId     String    @unique
  stripeSubscriptionId String?
  stripePriceId        String?
  subscriptionStatus   String?
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean   @default(false)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

// ── Team ───────────────────────────────────────────────────────────
model Invitation {
  id          String           @id @default(cuid())
  workspaceId String
  email       String
  role        MemberRole       @default(EDITOR)
  token       String           @unique
  status      InvitationStatus @default(PENDING)
  invitedById String
  expiresAt   DateTime
  acceptedAt  DateTime?
  createdAt   DateTime         @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, email])
}

// ── Preview & Domains ──────────────────────────────────────────────
model DraftToken {
  id          String    @id @default(cuid())
  workspaceId String
  name        String
  token       String    @unique
  expiresAt   DateTime?
  lastUsedAt  DateTime?
  createdAt   DateTime  @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

model CustomDomain {
  id          String   @id @default(cuid())
  workspaceId String
  domain      String   @unique
  verified    Boolean  @default(false)
  verifyToken String
  createdAt   DateTime @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

// ── Templates ─────────────────────────────────────────────────────
model ContentTypeTemplate {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String
  category    String
  fields      Json
  previewData Json?
  isPremium   Boolean  @default(false)
  usageCount  Int      @default(0)
  createdAt   DateTime @default(now())
}

model PageTemplate {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String
  category    String
  blocks      Json
  thumbnail   String?
  isPremium   Boolean  @default(false)
  usageCount  Int      @default(0)
  createdAt   DateTime @default(now())
}

// ── Enums ──────────────────────────────────────────────────────────
enum Plan {
  HOBBY
  PRO
  AGENCY
  ENTERPRISE
}

enum MemberRole {
  OWNER
  ADMIN
  EDITOR
  VIEWER
}

enum EntryStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum WebhookEvent {
  ENTRY_CREATED
  ENTRY_UPDATED
  ENTRY_PUBLISHED
  ENTRY_DELETED
  PAGE_CREATED
  PAGE_UPDATED
  PAGE_PUBLISHED
  PAGE_DELETED
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  PUBLISH
  UNPUBLISH
  ARCHIVE
  API_KEY_CREATED
  API_KEY_REVOKED
  WEBHOOK_FIRED
  MEMBER_INVITED
  MEMBER_REMOVED
  PLAN_CHANGED
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  EXPIRED
  REVOKED
}
```

---

## Part 11 — The Brutal Execution Priority

The audit says: "0% time on UI polish, 100% on infrastructure + commercial rails."

This is exactly right. Here is the exact sequence:

```
Sprint 1 (this week):
  Day 1:  Upstash Redis rate limiter (2 hours) + Connection pooler (10 min)
  Day 2:  Stripe integration — checkout sessions
  Day 3:  Stripe webhook handler — subscription lifecycle
  Day 4:  Billing UI — settings/billing page, upgrade buttons that work
  Day 5:  Workspace settings — rename, delete, member list

Sprint 2 (next week):
  Day 1:  Team invitations — send email, accept flow
  Day 2:  Real usage analytics — connect UsageLog to dashboard chart
  Day 3:  Sentry integration + QStash for webhooks
  Day 4:  Draft tokens + preview button that works
  Day 5:  Audit logs — schema migration + basic UI

Sprint 3 (week 3):
  Day 1-2: Content type templates (12 listed above)
  Day 3-4: Page templates (6 listed above)
  Day 5:   New blocks — Quote, Code, Callout, Accordion

Sprint 4 (week 4):
  Day 1-2: Environments (staging/prod split)
  Day 3:   AI SEO generator
  Day 4-5: Launch prep — Loom demo, landing page copy, Product Hunt draft
```

After Sprint 4, the product is genuinely sellable. Before Sprint 4, it is a demo.

---

*FlowCMS Product Guide v2.0 — Written May 2026*