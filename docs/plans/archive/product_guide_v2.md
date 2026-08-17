# FlowCMS — Final Product Guide
## The complete reference for what we are building, why, and in what order

> Version 1.0 — May 2026  
> Status: Waitlist launch imminent. Dashboard in controlled development.

---

## Part 1 — What FlowCMS Actually Is

**The one-line version:**  
The headless CMS for developers who want Sanity-quality DX at Strapi-level pricing, with zero infrastructure to manage.

**The honest version:**  
FlowCMS sits in the gap between "expensive enterprise SaaS" (Contentful at $300/month) and "complex self-hosted VPS" (Strapi requiring DevOps knowledge). It is built for three specific audiences:

1. **Indie developers** building client sites who need a CMS they can hand off to non-technical editors
2. **Solo founders** who outgrew Notion but cannot justify Contentful pricing
3. **Small dev agencies** managing multiple client workspaces under one account

**What we are NOT building:**  
- Enterprise workflow engines with complex approval chains
- A WordPress clone with plugins and themes
- A generic database GUI
- Anything that requires a developer to configure before an editor can use it

**The differentiator is not features. It is simplicity + price + a beautiful editor.**

---

## Part 2 — Current System Architecture

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 15 (App Router) | Full-stack, SSR, API routes |
| Language | TypeScript | Type safety throughout |
| Database | PostgreSQL on Supabase (port 6543) | Primary data store |
| Auth | Better Auth | Sessions, Google OAuth, email/password |
| Billing | Razorpay | Subscriptions, UPI Autopay |
| Email | Resend | Transactional emails, idempotency via EmailLog |
| Rate Limiting | Upstash Redis (sliding window) | Per-workspace API protection |
| Background Jobs | Upstash QStash | Webhooks, usage increments |
| Error Tracking | Sentry | Production error visibility |
| CDN Layer 1 | Cloudflare | DNS, WAF, cache (Authorization header stripped from cache key) |
| CDN Layer 2 | Vercel | Global CDN, serverless functions |
| Cache Layer 3 | Next.js unstable_cache | DB query caching with revalidateTag |
| Storage | Supabase Storage | Media uploads |
| Docs | Fumadocs | /docs, MDX-based |
| Styling | Tailwind CSS 4 + Meridian design system | Sharp, industrial UI |

### Caching request path
```
API call → Cloudflare Worker (auth + rate limit + monthly count) 
         → Cloudflare Cache (60s TTL, URL-keyed, no Authorization in key) 
         → Vercel CDN (60s TTL) 
         → Next.js cache (unstable_cache, revalidateTag on publish) 
         → Supabase PostgreSQL
```

### Target latency with all layers warm
| Scenario | Latency | Frequency |
|---|---|---|
| Cloudflare cache hit | 8–20ms | ~90% of traffic |
| Vercel CDN hit | 30–60ms | ~8% |
| Next.js cache hit | 50–80ms | ~1.5% |
| Full DB query | 300–800ms | ~0.5% |

---

## Part 3 — Pricing

### Plan Structure

**HOBBY — Free forever**
- 3 content types
- 5,000 API requests/month
- 1 workspace, 1 environment
- Community support
- No webhooks
- No custom API domain
- FlowCMS branding on API responses (`X-Powered-By` header)

**PRO — ₹1,999/month**
- Unlimited content types
- 250,000 API requests/month
- 1 workspace, 3 environments (prod + staging + dev)
- Webhooks (up to 5 endpoints)
- Custom API domain (api.yourdomain.com)
- Remove FlowCMS branding
- Draft preview tokens
- Email support (48hr SLA)
- 7-day usage history
- 20 AI generations/day

**AGENCY — ₹6,499/month**
- Everything in Pro
- 5 workspaces
- 1,000,000 API requests/month (pooled)
- 10 webhook endpoints
- Team members (up to 5 seats)
- White-label dashboard
- Priority support (12hr SLA)
- 30-day usage history
- Audit logs
- 50 AI generations/day

**ENTERPRISE — Custom pricing (~₹25,000+/month)**
- Unlimited workspaces and requests
- SSO (SAML/OIDC)
- Custom roles and permissions
- 99.9% uptime SLA
- GDPR DPA
- Dedicated Slack channel

### What counts as an API request
Every hit to `/api/v1/*` with a valid API key, cached or not. Specifically:

```
✅ Counts:   GET /v1/entries/blog-post
✅ Counts:   GET /v1/pages/home
✅ Counts:   GET /v1/media
❌ No count: Dashboard API calls (/api/internal/*)
❌ No count: Webhook delivery attempts
❌ No count: Failed auth (401 responses)
```

### Revenue streams beyond subscriptions

| Stream | Description | Launch timing |
|---|---|---|
| Overage billing | ₹0.15 per 1,000 requests over plan limit | Month 3 |
| Seat expansion | ₹999/seat beyond plan limit | Month 4 |
| AI credits | ₹750 for 100 AI generations | Month 6 |
| Priority support addon | ₹3,999/month, 4hr response guarantee | Month 6 |
| Premium templates | ₹750 per template pack | Month 6 |

### Waitlist offer
**First 30 developers get 1 month of Pro free.**  
This is the final, confirmed offer. Do not change it. 30 users × 1 month = controlled, measurable cost.

---

## Part 4 — Feature Flags & Launch Gating

The `lib/launch.ts` file controls what is available at any given launch phase.

```typescript
export const LAUNCH_MODE: "waitlist" | "early_access" | "open" = "waitlist";

export const isWaitlistMode = LAUNCH_MODE === "waitlist";

export const FEATURES = {
  enableBilling: true,           // Razorpay is implemented
  enableWebhooks: true,          // Behind Pro gate
  enableCustomDomains: false,    // Not yet implemented
  enableTeamInvites: true,       // Invitation model exists
  enableApiKeyGeneration: true,  // Core feature
  enableEnvironments: true,      // Environments model exists
  enableAiFeatures: true,        // Gemini integration exists
  enableAuditLogs: true,         // AuditLog model exists
  enableWhiteLabel: false,       // Agency feature, not yet built
};
```

Any feature with `false` must return `403` from its API route, not just be hidden in UI.

---

## Part 5 — Database Schema Summary

### Core models and their purpose

| Model | Purpose | Key fields |
|---|---|---|
| User | Auth identity | email, emailVerified, onboarded |
| Workspace | Tenant container | plan, slug, planExpiresAt |
| WorkspaceMember | User↔Workspace join | role (OWNER/ADMIN/EDITOR/VIEWER) |
| Environment | Staging/Production split | slug, isDefault |
| ContentType | Schema definition | fields (JSON), slug |
| Entry | Content instance | data (JSON), status, version, localeCode |
| Page | Block-based page | blocks (JSON), status, SEO fields |
| Media | Uploaded files | url, mimeType, size, folder |
| ApiKey | v1 API authentication | keyHash (never plaintext), scopes, environmentId |
| Webhook | Event delivery config | url, events[], secret |
| WebhookDelivery | Delivery log | statusCode, success, duration |
| UsageLog | Per-request observability | endpoint, duration, cacheHit |
| MonthlyUsage | Plan limit tracking | apiRequests, unique per workspace+month |
| AuditLog | Admin/team audit trail | action, before, after, userId |
| RazorpayCustomer | Billing state | subscriptionId, subscriptionStatus |
| Invitation | Team invite flow | token, expiresAt, status |
| DraftToken | Preview token | token, expiresAt, lastUsedAt |
| CustomDomain | Agency API domains | domain, verified, verifyToken |
| WaitlistEntry | Pre-launch signups | position, priority, referralCode, status |
| EmailLog | Email idempotency | idempotencyKey, status, attempts |
| ContentTypeTemplate | Pre-built schemas | fields (JSON), category, isPremium |
| PageTemplate | Pre-built block layouts | blocks (JSON), category, isPremium |

### WaitlistEntry status flow
```
PENDING → CONFIRMED → APPROVED → INVITED → JOINED
                    ↘ REJECTED
INVITED → EXPIRED (if inviteExpiresAt passes)
JOINED → SUSPENDED / REVOKED (admin action)
```

---

## Part 6 — API Architecture

### Versioning
All public content APIs are under `/api/v1/`. Internal dashboard APIs are under `/api/internal/`. Admin APIs are under `/api/admin/`.

Every v1 response includes:
```
X-API-Version: 1
X-RateLimit-Limit: [limit]
X-RateLimit-Remaining: [remaining]
X-RateLimit-Reset: [unix timestamp]
Cache-Control: public, s-maxage=60, stale-while-revalidate=300
Cache-Tag: workspace-[id],entries-[slug]
```

Dashboard and internal routes include:
```
Cache-Control: private, no-store
```

Draft preview requests include:
```
Cache-Control: private, no-store, no-cache
```

### Adding v2 in the future
When v2 routes are needed:
1. Create `/api/v2/` directory
2. v1 routes remain unchanged
3. v2 routes may use different response shapes but must be documented in `VERSIONING.md`
4. Deprecation notice is added to v1 response headers: `Deprecation: true, Sunset: [date]`
5. v1 is supported for minimum 12 months after v2 launch

---

## Part 7 — Content Type Templates (12 to ship on launch)

### Blog & Publishing
- **Blog Post** — title, slug, author, coverImage, excerpt, body (richtext), tags, seoTitle, seoDescription
- **Author** — name, bio, avatar, twitter, website

### E-commerce
- **Product** — name, slug, description, price, comparePrice, images, sku, inStock, category, tags
- **Product Category** — name, slug, description, image, parentCategory

### Marketing
- **Landing Page Section** — heading, subheading, body, ctaLabel, ctaUrl, image, imagePosition, backgroundColor
- **Testimonial** — quote, author, role, company, avatar, rating
- **FAQ** — question, answer, category, order

### Documentation
- **Doc Page** — title, slug, body, category, order, lastUpdated, contributors

### Team & Company
- **Team Member** — name, role, bio, photo, email, linkedin, github, order
- **Job Opening** — title, department, location, type, description, requirements, salary, applyUrl, closingDate
- **Case Study** — title, client, industry, challenge, solution, results, coverImage, publishedDate
- **Event** — title, slug, description, startDate, endDate, location, isOnline, registrationUrl, coverImage

---

## Part 8 — Block Types

### Currently implemented
Heading, Rich Text, Image, CTA, Divider

### To implement in Sprint 3

| Block | Category | Key props |
|---|---|---|
| Quote | Text | text, author, role, avatar |
| Code | Text | language, code, filename, showLineNumbers |
| Callout | Text | type (info/warning/danger/success), title, body |
| HTML | Text | content (raw HTML escape hatch) |
| Video | Media | url, provider, autoplay, caption |
| Gallery | Media | images[], layout (grid/masonry/carousel) |
| Embed | Media | url, type (tweet/codepen/figma) |
| Columns | Layout | columnCount, gap, blocks[][] |
| Spacer | Layout | height (sm/md/lg/xl) |
| Accordion | Interactive | items[] (question, answer), allowMultiple |
| Table | Interactive | headers[], rows[][], striped |
| Form | Interactive | formId, fields[], submitLabel |

### Block categories in the editor palette
```
Text        — Heading, Rich Text, Quote, Code, Callout, HTML
Media       — Image, Video, Gallery, Embed
Layout      — Columns, Spacer, Divider
Interactive — CTA, Form, Accordion, Table
```

---

## Part 9 — AI Features

### Provider strategy
- **Phase 1:** Gemini 2.0 Flash via direct REST API (free tier, 1,500 requests/day)
- **Safety buffer:** Global cap at 1,200 requests/day (80% of limit)
- **Migration path:** Provider-agnostic abstraction in `lib/ai/index.ts` to swap to Claude or Groq via env var

### Per-workspace limits
| Plan | AI generations/day |
|---|---|
| HOBBY | 3 |
| PRO | 20 |
| AGENCY | 50 |

### Features to build

**AI SEO Generator (Sprint 4)**  
One-click generation of seoTitle and seoDescription from entry content. Uses Gemini Haiku-equivalent. Gate behind Pro plan.

**AI Content Type Generator (Sprint 4)**  
User describes their use case in plain English → AI generates the full field schema. Most powerful onboarding feature.

**AI Content Suggestions (Post-launch)**  
Inline suggestions while editing: complete sentence, make concise, translate, generate headlines. Gate behind Pro plan.

---

## Part 10 — Execution Roadmap

### Sprint 1 — Stability Foundation (this week)
```
Day 1:  PgBouncer connection string (10 min) + Upstash Redis rate limiter (2 hours)
Day 2:  Razorpay checkout session implementation
Day 3:  Razorpay webhook handler (subscription lifecycle)
Day 4:  Billing UI — /settings/billing with working upgrade buttons
Day 5:  Workspace settings — rename, delete, danger zone
```

### Sprint 2 — Production Reliability (next week)
```
Day 1:  Team invitations — Invitation model + Resend email flow
Day 2:  Real usage analytics — connect UsageLog to dashboard chart (Recharts)
Day 3:  QStash integration — move webhooks + usage to async jobs
Day 4:  Draft preview tokens — ?_token= param in v1 API
Day 5:  Audit log UI — basic table in admin + dashboard
```

### Sprint 3 — Content Velocity (week 3)
```
Day 1-2: 12 content type templates
Day 3-4: 6 page templates
Day 5:   New blocks — Quote, Code, Callout, Accordion
```

### Sprint 4 — Launch Preparation (week 4)
```
Day 1-2: Environments — staging/production content split
Day 3:   AI SEO generator (Gemini integration)
Day 4-5: Launch assets — Loom demo, Product Hunt draft, landing page final copy
```

**After Sprint 4, the product is genuinely sellable. Before Sprint 4, it is a demo.**

---

## Part 11 — Open Source Strategy

### Repository structure
```
flowcms/
  src/                    Application source
  prisma/                 Schema and migrations
  content/docs/           Fumadocs MDX content
  Dockerfile              Multi-stage build
  docker-compose.yml      Local development + self-hosting
  .dockerignore
  SELF_HOSTING.md         Self-hosting instructions
  VERSIONING.md           API versioning contract
  CONTRIBUTING.md         How to contribute
  LICENSE                 MIT
  README.md               Project overview
```

### README must include
1. What FlowCMS is (1 paragraph)
2. Live URL (getflowcms.com)
3. Tech stack (one line each)
4. Local setup (5 commands max)
5. Link to full docs
6. Contributing guide link
7. MIT license badge

### .gitignore must exclude
```
.env
.env.local
.env.production
.env*.local
node_modules/
.next/
.source/
*.log
```

### Open source rules
- No personal email addresses in code (only .env)
- No internal URLs hardcoded (only .env)
- No API keys or tokens in any committed file
- All TODO comments must reference a GitHub issue number

---

## Part 12 — X (Twitter) Build-in-Public Strategy

### Three post types, rotating weekly

**1. Shipping posts (every Friday)**  
One screenshot or short video showing exactly what shipped. No threads. No vision statements.  
Example: *"Shipped: live preview tokens for FlowCMS. Add `?_token=abc` to any fetch and get draft content. Ships in v0.3.0."*

**2. Problem posts (once per week)**  
One specific technical problem encountered and how it was solved. Developers share these.  
Example: *"Spent 3 hours debugging Cloudflare cache bypass. The Authorization header was the culprit. Stripping it from the cache key fixed everything. Here's exactly how."*

**3. Milestone posts (event-driven)**  
Waitlist live, first 10 signups, first approval, first real user, first paying customer. Include a real screenshot.

### Rules
- Tag @nextjs, @vercel, @supabase, @upstash only when content is directly about their product
- No marketing copy
- No generic "I'm building a CMS" posts
- No threads explaining the vision
- Only specific, technical, real content

### KPIs to share publicly
- Waitlist signup count (weekly)
- GitHub stars (weekly)
- First paying customer (milestone post)
- API request count for beta users (after first approvals)

---

## Part 13 — Founder Operating Rules

1. **Sentry-first.** Fix errors before writing features. An error in production is a user losing trust.
2. **Friday ships.** Visible progress every week. Even a small UI improvement counts.
3. **No bloat.** If a feature is not gated behind Pro or Agency, it is a distraction.
4. **Localhost trap.** If it works on dev but not Vercel, it does not work. Fix the infrastructure.
5. **Docs before demos.** If you cannot explain how a feature works in one doc page, it is not ready to ship.
6. **Revenue rails before feature rails.** Billing must work before any new content features are added.

---

## Part 14 — Launch Checklist

### Before waitlist goes live
- [ ] Docker setup complete (Dockerfile + docker-compose.yml + SELF_HOSTING.md)
- [ ] Waitlist copy reads "First 30 developers get 1 month of Pro free" everywhere
- [ ] ref param captured in WaitlistForm and sent to API
- [ ] referralCode stored lowercase, self-referral guard in place
- [ ] X-API-Version header on all v1 responses
- [ ] Upstash Redis rate limiter (not in-memory Map)
- [ ] Supabase connection string on port 6543
- [ ] Sentry initialized (server + client)
- [ ] ADMIN_EMAIL set in .env (not hardcoded)
- [ ] All planned features marked as "Coming Soon" on landing page
- [ ] OG image, meta title, meta description set in app/layout.tsx
- [ ] robots.txt in /public
- [ ] MIT LICENSE file committed
- [ ] README.md complete
- [ ] .gitignore excludes .env, .source/, .next/
- [ ] No API keys or secrets in any committed file

### Before first user approvals (week 3)
- [ ] Audit logging for admin actions
- [ ] Invite email sends correctly via Resend with working token link
- [ ] Invite token consumption (inviteUsedAt set after registration)
- [ ] Expired token rejection
- [ ] Admin cannot approve/revoke themselves accidentally

### Before charging anyone
- [ ] Razorpay webhook handler live
- [ ] Plan limits enforced at API level (not just UI)
- [ ] Billing settings page shows current plan and upgrade path
- [ ] Downgrade logic works (subscription.cancelled → HOBBY at period end)

---

*FlowCMS Product Guide v1.0 — May 2026*  
*Single source of truth. Update this document when any architectural decision changes.*