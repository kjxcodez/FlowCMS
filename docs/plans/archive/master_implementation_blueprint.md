# FLOWCMS MASTER IMPLEMENTATION BLUEPRINT

## PART 1 — PRODUCT TRUTH

*   **What it is:** The headless CMS for developers who want Sanity-quality DX at Strapi-level pricing, with zero infrastructure to manage.
*   **Who it is for:** Indie developers building client sites, solo founders who outgrew Notion/Contentful, and small dev agencies managing multiple client sites.
*   **Problem it solves:** Removes the choice between "expensive enterprise SaaS" (Contentful) and "complex self-hosted VPS" (Strapi).
*   **Market Positioning:** "Industrial-Editorial" craft. High design fidelity, developer-first simplicity, and aggressive Indian-market pricing (Razorpay/UPI).
*   **What we are NOT building:** Enterprise workflow engines, complex multi-region data residency, or a generic "Wordpress clone."
*   **Anti-Bloat Rules:**
    *   No feature added without a clear PRO/AGENCY plan gate.
    *   No UI component introduced that deviates from Meridian’s angular/industrial aesthetic.
    *   No infrastructure that exceeds the ₹0/month launch budget.
*   **Execution Philosophy:** Infrastructure stability first, UI polish second. A "Glass House" (beautiful UI, weak backend) is the primary risk.

---

## PART 2 — FINAL SYSTEM ARCHITECTURE

*   **Core:** Next.js 15 (App Router), TypeScript, Tailwind CSS 4.
*   **Database:** PostgreSQL on Supabase (using Transaction Pooler on port 6543).
*   **Auth:** Better Auth (Google + Email/Password).
*   **Billing:** Razorpay Subscriptions (UPI Autopay focus for India, PA-CB for International).
*   **Caching:** 4-Layer stack:
    1.  Cloudflare Edge (Cache Rules: Strip `Authorization` header).
    2.  Vercel CDN (Cache-Control: `public, s-maxage=60, stale-while-revalidate=300`).
    3.  Next.js `unstable_cache` with `revalidateTag`.
    4.  Supabase PgBouncer for DB connection efficiency.
*   **Queue/Async:** Upstash QStash for webhooks and usage increments.
*   **Rate Limiting:** Upstash Redis (Serverless) using sliding window algorithm.
*   **Cloudflare Worker (Edge enforcement layer):**
    *   Runs BEFORE cache on every `/api/v1/*` request.
    *   Responsibilities: API key validation, rate limit check (Upstash), monthly counter increment, plan feature gating.
    *   KV Store: Cloudflare KV for key lookup cache (60s TTL) to avoid DB hits on every request.
*   **AI Engine:** Gemini 2.0 Flash (Free Tier) via direct REST API.
*   **Monitoring:** Sentry for error tracking, custom `UsageLog` for internal analytics.
*   **Deployment:** Vercel (Production) + Cloudflare (DNS/WAF/Edge).

---

## PART 3 — DATABASE IMPLEMENTATION PLAN

### Migration Dependency Order
1.  **Billing Layer:** Replace `StripeCustomer` placeholder with `RazorpayCustomer`.
2.  **Infrastructure Layer:** Add `Environment` (Staging/Prod) and `AuditLog`.
3.  **Team Layer:** Add `Invitation` model to unlock multi-user workspaces.
4.  **Feature Layer:** Add `DraftToken`, `ContentTypeTemplate`, and `PageTemplate`.

### Exact Model Extensions
*   **Entry:** Add `environmentId` (nullable), `version` (Int), `localeCode` (String).
*   **Page:** Add `environmentId`, `seoTitle`, `seoDesc`, `ogImage`, `canonicalUrl`, `noIndex`.
*   **ApiKey:** Add `environmentId`, `scopes` (String[]).
*   **Workspace:** Add relations to all new models.

---

## PART 4 — FEATURE IMPLEMENTATION ORDER

### Sprint 1 — The Stability Foundation
1.  **PgBouncer:** Switch `.env` to port 6543. (Fixes DB crashes).
2.  **Upstash Redis RL:** Move from in-memory Map to `@upstash/ratelimit`.
3.  **Razorpay Integration:** Checkout sessions + Webhook lifecycle (activated/charged/cancelled).
4.  **Billing UI:** Finalize `/settings/billing` with working upgrade paths.
5.  **Workspace Management:** Rename/Delete/Danger Zone in settings.

### Sprint 2 — Production Reliability
1.  **Team Invites:** `Invitation` model + Resend email flow (3,000 emails/mo free).
2.  **Real Analytics:** Connect `UsageLog` data to dashboard charts.
3.  **QStash Integration:** Move webhooks and usage increments to async jobs.
4.  **Draft Preview:** Implement `?_token=` param in API v1.
5.  **Audit Logs:** Implement backend tracking for all state-changing actions.

### Sprint 3 — Content Velocity
1.  **CT Templates:** 12 pre-built schemas (Blog, Product, Case Study, etc.).
2.  **Page Templates:** 6 block-editor layouts (Landing, Docs, Contact, etc.).
3.  **New Blocks:** Quote, Code, Callout, Accordion (Industrial-Editorial style).

### Sprint 4 — The Launchpad
1.  **Environments:** Logic to split Staging and Production content/keys.
2.  **AI SEO Gen:** Gemini 2.0 Flash integration for one-click metadata.
3.  **Fumadocs:** 6 essential doc pages (QuickStart, Next.js, API Ref).
4.  **Launch Assets:** Loom demo, PH kit, Pricing-finalized landing page.

---

## PART 5 — BILLING + MONETIZATION EXECUTION

*   **Gateway:** Razorpay (India-first, UPI Autopay).
*   **Plans:**
    *   **Hobby:** Free (5k requests/mo, 3 CTs, 3 AI generations/day).
    *   **Pro (₹1,999/mo):** 250k requests/mo, Unlimited CTs, 20 AI generations/day, Draft Preview.
    *   **Agency (₹6,499/mo):** 1M requests/mo, 5 Workspaces, 50 AI generations/day, Custom Domain.
*   **Usage Counting:** Increment on every v1 API request (cached or not).
*   **Enforcement:** Middleware checks `MonthlyUsage` vs Plan Limit. Fail with 403 on limit exceeded.
*   **Overage:** $0.002 per request (Post-launch month 2).

---

## PART 6 — CACHING + PERFORMANCE EXECUTION

### Edge Enforcement Layer (Cloudflare Worker)
The Worker sits in front of the Cloudflare cache to ensure every request—even cache hits—is authenticated and metered.

**Request Path:**
`Caller` → `CF Worker (auth + rate limit + count)` → `CF Cache` → `Vercel` → `DB`

### Caching Strategy
*   **Cloudflare Fix:** Create Cache Rule to **ignore** `Authorization` header in cache key. This is non-negotiable for Layer 1.
*   **Purge Strategy:** Surgical invalidation using `purge_cache` by `tags` on publish.
*   **Next.js Cache:** Use `unstable_cache` with `revalidateTag` for all DB reads.
*   **Non-cacheables:** Any request with `_token`, `/api/internal/*`, and all POST/PUT/DELETE calls.

---

## PART 7 — ADMIN + INTERNAL OPERATIONS

*   **Security:** Fixed `ADMIN_EMAIL` in `.env`. Checked in `requireAdmin()` middleware.
*   **Operational Tooling:**
    *   **Impersonation:** View a user's dashboard as they see it.
    *   **Force Plan Change:** Manual override for beta testers.
    *   **Abuse Monitor:** High-volume request tracking.
    *   **Announcements:** Global dashboard banners.

---

## PART 8 — DOCUMENTATION EXECUTION

*   **Stack:** Fumadocs (Next.js native).
*   **Structure:** Introduction -> Quick Start (5m) -> Next.js Integration -> API Reference -> Webhooks -> Field Types.
*   **Growth Loop:** High-intent SEO keywords (e.g., "headless cms nextjs razorpay").

---

## PART 9 — AI FEATURES EXECUTION

### Provider Strategy
*   **Phase 1:** Gemini 2.0 Flash (Free Tier).
*   **Quota:** 1,500 requests/day.
*   **Implementation:** REST-based (direct `fetch` to Gemini API) to minimize dependencies.

### Rate Limiting Architecture
To prevent free tier exhaustion and abuse, a dual-layer Upstash Redis rate limit is mandatory:
1.  **Global Daily Cap:** Set at 1,200 requests/day (80% of Gemini's limit) to provide a safety buffer.
2.  **Per-Workspace Plan Limit:**
    *   **HOBBY:** 3 gens/day
    *   **PRO:** 20 gens/day
    *   **AGENCY:** 50 gens/day

### UI / UX Flow
*   Display remaining daily count next to AI action buttons (e.g., "14 remaining today").
*   On exhaustion, provide a clear upgrade path to PRO or a notice regarding midnight resets.
*   AI features focused purely on utility: **AI SEO Generator** and **AI Content Type Schema Generator**.

### Scaling / Migration Path
Use a provider-agnostic abstraction (`lib/ai/index.ts`) to allow instant switching between Gemini, Groq (Llama 3.1), or Claude (paid tier) via environment variables.

---

## PART 10 — LAUNCH EXECUTION

*   **Blockers:** No Stripe (Razorpay only), no Redis RL, no real usage tracking.
*   **Strategy:** Founder-led (Twitter/LinkedIn) -> Agency Outreach (White-label pitch) -> Product Hunt.
*   **KPIs:** Active Workspaces, Paid Conversions, API Uptime.

---

## PART 11 — FOUNDER OPERATING RULES

1.  **Sentry-First:** Fix errors before writing features.
2.  **Friday Ships:** Visible progress every week.
3.  **No Bloat:** If it's not a PRO/AGENCY gate, it's a distraction.
4.  **Localhost Trap:** If it works on dev but not Vercel, it doesn't work. Fix the infra.

---

## DESIGN SYSTEM + FRONTEND IMPLEMENTATION RULE (MANDATORY)

*   **Constraint:** All UI must adhere to **Meridian**.
*   **Visual Pillars:** Sharp edges, ruled/graph paper textures, Playfair Display headers, Sap Green/Electric Lime accents.
*   **No Softness:** Reject rounded, "soft" startup UI trends.
*   **Motion:** High-end, subtle Framer Motion transitions only.
