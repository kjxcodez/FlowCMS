FlowCMS
Solo Founder Complete Implementation Plan
Zero development cost · Production-ready stack · Single developer execution
Current State
85% MVP · 40% Production-ready	Target (4 Sprints)
100% sellable SaaS product	Infra Cost at Launch
₹0/month until real revenue

Version 1.0  ·  May 2026  ·  FlowCMS / Meridian
 
1. Honest Product Snapshot
You have built a "Glass House" — world-class UI on a localhost-grade backend. This plan fixes the foundation before you add any more rooms.

1.1 What Actually Works
•	Multi-tenant architecture via Prisma + Supabase Postgres
•	Better Auth with Google + Email/Password, full onboarding pipeline
•	Dynamic content modeling — ContentType system with JSON schema stored in Postgres
•	Content Entry CRUD with Draft / Published / Archived status
•	Visual block editor (dnd-kit) — Heading, Text, Image, CTA, Divider
•	Public REST API v1 with pagination, filtering, status checks
•	API key lifecycle — creation, hashing, last-used tracking
•	Webhook engine — HMAC SHA256 signed POST, delivery logs
•	Real-time usage tracking middleware — latency, status codes, monthly limits
•	Meridian design system — Tailwind 4, Playfair Display, DM Sans, matches DESIGN.md

1.2 What Is Broken / Missing
Gap	Impact	Fix Sprint
In-memory rate limiter	Resets on every Vercel cold start — NOT production-ready	Sprint 1 Day 1
Blocking webhook execution	Slow user webhook = CMS timeout	Sprint 2
No DB connection pooler	First 10 concurrent users crash Postgres	Sprint 1 Day 1
Zero Stripe/Razorpay integration	Cannot charge anyone	Sprint 1
Workspace settings = placeholder	Users cannot rename or delete workspace	Sprint 1
No member management	CMS schema supports teams, UI does not	Sprint 2
Usage dashboard uses hardcoded data	Purely decorative feature	Sprint 2
No Sentry / observability	Silent failures in webhooks and usage tracker	Sprint 2
No audit logs UI	Schema exists, no interface	Sprint 2
 
2. The Zero-Cost Production Stack
Every tool below has a free tier that is genuinely sufficient until you have meaningful paying customers. Total infrastructure cost at launch: ₹0/month.

Layer	Tool	Free Tier	When You Pay
Hosting / Deploy	Vercel (Hobby)	Unlimited deploys, 100GB bandwidth	When you need team access or SLA
Database	Supabase (Free)	500MB DB, 1GB storage, 2M rows	When DB > 500MB
Connection Pooler	Supabase PgBouncer	Free — built in, just switch port	–– Always free
Rate Limiting	Upstash Redis	500K commands/month free	$0.20 per 100K extra
Background Jobs	Upstash QStash	1,000 messages/day free	$1 per 100K messages
Error Tracking	Sentry (Free)	5,000 errors/month free	Almost never at early stage
Email (transactional)	Resend (Free)	3,000 emails/month free	$20 for 50K emails/mo
CDN / Edge Cache	Cloudflare (Free)	200 PoPs, cache rules, cache tags	Never for our use case
Payments (India)	Razorpay	No monthly fee	2% per transaction
Docs	Fumadocs in same Next.js repo	Free — same deployment	–– Always free
Admin panel	Custom /admin route	Free — in your codebase	–– Always free

Math check: 100 Hobby users × 5 API calls/day = 500 Redis checks/day. Free tier is 8,333/day. You have 16× headroom before paying a rupee on infra.
 
3. Payment Gateway — Razorpay (Not Stripe)
3.1 Why Not Stripe
•	Stripe India is invite-only — no guaranteed access
•	~6.3% effective fee for Indian businesses on international payments
•	No FIRA (Foreign Inward Remittance Advice) — mandatory for Indian businesses receiving foreign payments
•	Cannot use UPI AutoPay for subscriptions — misses 60%+ of Indian payment volume

3.2 Why Razorpay
•	You already know the integration — that knowledge has real value
•	Razorpay secured PA-CB (Payment Aggregator: Cross Border) RBI license in December 2025 — legally accepts international cards into your Indian bank account
•	UPI AutoPay handles recurring subscriptions natively — ₹2,000/month Pro plan fits comfortably within UPI mandate limits
•	Built-in RBI compliance: 72-hour advance notification + OTP/PIN mandate authentication — you do not build this yourself
•	No invite process. No compliance gaps. 2% transaction fee only.

3.3 Pricing in INR
Plan	Monthly	Annual	Annual Saving
HOBBY	Free forever	Free forever	–
PRO	₹1,999/month	₹19,999/year	~17% off (~$24 USD)
AGENCY	₹6,499/month	₹62,999/year	~19% off (~$79 USD)

Show INR to Indian users (detect via browser locale or IP), USD on the public landing page. Razorpay checkout handles multi-currency display.
 
4. Caching Architecture — 4 Layers
Goal: 95%+ of API traffic never reaches your database. The cache diagram in your docs shows this clearly.

Layer	Tool	Hit Latency	Key Action Required
Layer 1	Cloudflare edge cache	8–20ms	Cache Rule: strip Authorization from cache key
Layer 2	Vercel CDN	30–60ms	Cache-Control: public, s-maxage=60, stale-while-revalidate=300
Layer 3	Next.js unstable_cache	50–80ms	Tag fetches with next.tags; call revalidateTag on publish
DB (miss)	Supabase + PgBouncer	200–600ms	Switch to pooled connection string (port 6543)

The Authorization header problem: Cloudflare bypasses cache for requests with Authorization headers by default. You MUST create a Cache Rule that strips Authorization from the cache key and caches based on URL + workspace only. Without this, Layer 1 does nothing.

4.1 TTL Reference
Content Type	Cloudflare TTL	Vercel TTL	Notes
Published entries	60s	60s	Purge on publish via Cloudflare API + revalidateTag
Published pages	60s	60s	Same as entries
Media metadata	3600s	3600s	Rarely changes
Content type schema	300s	300s	Schema changes are infrequent
Draft content (?_token=)	BYPASS — never cache	BYPASS	Never cache draft tokens
Internal dashboard API	BYPASS — private, no-store	BYPASS	Session-gated, always bypass
 
5. The 4-Sprint Execution Plan
Rule for a solo founder: never work on UI polish until the infrastructure is stable and billing is connected. A beautiful product that crashes under 10 users is not a product.

Sprint 1 — Week 1: Ship Before Anyone Gets Hurt
These are the changes you make before a single person pays you. Every one of these is a production incident waiting to happen.

#	Task	What You're Fixing	Est. Time	Cost
1	Switch to Supabase PgBouncer (port 6543)	DB crashes under 10 concurrent users	10 minutes	₹0
2	Upstash Redis rate limiter (@upstash/ratelimit)	In-memory rate limiter resets on cold start	2–3 hours	₹0
3	Razorpay subscription checkout session	Cannot charge anyone	1 day	₹0
4	Razorpay webhook handler (subscription lifecycle)	Plan not updated after payment	1 day	₹0
5	Billing UI — /settings/billing, working upgrade buttons	"Upgrade" buttons are dead links	1 day	₹0
6	Workspace settings — rename, delete, danger zone	Users are locked out of managing their account	1 day	₹0
7	Cloudflare Cache Rule (strip Authorization header)	Layer 1 cache is completely inoperative	1 hour	₹0

Sprint 1 total: ~5 days. After Sprint 1, you can charge money and your system will not fall over on the first paying user.

Sprint 2 — Week 2: Make It Reliable

#	Task	Why It Matters	Est. Time	Cost
1	Team member invitations (Invitation model + email)	CMS without a team is just a blog	2 days	₹0
2	Real usage analytics — connect UsageLog to dashboard	"Usage" page is currently fake/decorative	1 day	₹0
3	Sentry integration (5 min setup)	Silent failures in webhooks, fire-and-forget handlers	2 hours	₹0
4	QStash background jobs — move webhooks out of request cycle	Slow user webhook = CMS timeout	1 day	₹0
5	Draft tokens + working Preview button	Preview button is a placeholder — highest dev satisfaction feature	1 day	₹0
6	Audit logs — schema migration + basic UI	Required for any team plan credibility	1 day	₹0

Sprint 2 total: ~5 days. After Sprint 2, the product is reliable enough for early Beta testers. Error rate drops from "unknown" to "visible and manageable."
 
Sprint 3 — Week 3: Make It Useful

#	Task	Why It Matters	Est. Time	Cost
1	12 Content Type Templates (Blog, Product, FAQ, etc.)	New users skip blank-slate anxiety, onboarding conversion up	2 days	₹0
2	6 Page Templates (Landing, Blog, Contact, About, Docs, Product)	Block editor adoption increases dramatically	2 days	₹0
3	4 new blocks: Quote, Code, Callout, Accordion	Editor completeness for developer-focused content	1 day	₹0

Sprint 3 total: ~5 days. After Sprint 3, the product feels complete for the target audience. A developer can sign up and publish content in under 10 minutes.

Sprint 4 — Week 4: Make It Launchable

#	Task	Why It Matters	Est. Time	Cost
1	Environments (staging/prod split)	Unlocks Agency plan value — devs need staging	2 days	₹0
2	AI SEO generator (Claude Haiku, ~₹0.08/call)	PRO plan differentiation. <₹0.001 per generation = 98% margin	1 day	~₹0
3	Documentation site via Fumadocs	6 essential pages: QuickStart, Next.js, API ref, Webhooks, Fields, Rate limits	1 day	₹0
4	Launch prep: Loom demo, landing page copy, Product Hunt draft	You cannot sell without a demo. This IS the product at launch.	1 day	₹0

Sprint 4 total: ~5 days. After Sprint 4: the product is genuinely sellable. Before Sprint 4: it is a demo. Do not launch before Sprint 4.
 
6. Database Schema — What to Add
Your current schema is solid. These additions unlock the features planned above. Add them in this exact order to avoid migration conflicts.

New Model	Purpose	Sprint	Replaces
RazorpayCustomer	Billing — subscription ID, status, period end	1	StripeCustomer in guide
Environment	Staging / Production split per workspace	4	–– New
Invitation	Email invite tokens for workspace members	2	–– New
AuditLog	"Who changed what and when" — compliance + debug	2	–– New
DraftToken	Live preview tokens (?_token=) for draft content	2	–– New
ContentTypeTemplate	Pre-built schemas (Blog Post, Product, FAQ...)	3	–– New
PageTemplate	Pre-built block arrangements (Landing, About...)	3	–– New
CustomDomain (future)	api.yourclient.com → FlowCMS API routing	Month 3	–– New

6.1 Existing Models to Update
•	Entry: add environmentId (nullable), version (default 1), localeCode (default "en")
•	Page: add environmentId (nullable), ogImage, canonicalUrl, noIndex, localeCode
•	ApiKey: add environmentId (nullable), scopes String[] (for future fine-grained permissions)
•	Workspace: add RazorpayCustomer relation, all new model relations
 
7. Admin Panel Architecture
Use a fixed admin email in .env — not a SUPERADMIN role. A role leaks admin logic into every permission check. A fixed email checked at middleware level is simpler, faster, and has zero attack surface.

7.1 Access Pattern
•	Set ADMIN_EMAIL="your@email.com" in .env
•	requireAdmin() middleware redirects non-admins to /dashboard silently — never reveal that /admin exists
•	Add Cloudflare IP allowlist for /admin/* to your home/office IP as an extra layer
•	Never link to /admin from any public page, nav, or user menu

7.2 Admin Routes to Build
Route	What It Shows
/admin	Overview: total users, workspaces, MRR, system health
/admin/workspaces	All workspaces: plan, usage, last active, search
/admin/workspaces/[id]	Workspace detail, force plan change, impersonate user
/admin/users	All users: registration date, workspace, plan
/admin/usage	Global API request volume chart — abuse detection
/admin/webhooks	All webhook delivery logs system-wide
/admin/plans	Manual plan override for beta testers / influencers
/admin/announcements	Write a banner that appears in all dashboards
 
8. Documentation — Fumadocs Setup
Mount Fumadocs at /docs in your existing Next.js repo. Same deployment, same domain, zero extra cost. No Algolia account needed — Orama search runs in-browser.

8.1 Install
•	pnpm add fumadocs-ui fumadocs-core fumadocs-mdx
•	Add src/app/docs/ with DocsLayout and [[...slug]]/page.tsx
•	Write MDX files in content/docs/
•	Search works via Orama — free, in-browser, no external service

8.2 The 6 Pages You Must Write Before Launch
Everything else can be added post-launch. These 6 pages answer every question a new user will have.

Page	Why It's Essential	Time to Write
Quick Start (5 min guide)	Most important page. Shows the full loop: create type → entry → API call. First thing every user reads.	2–3 hours
Next.js Integration	Your primary customer's primary question. Include fetch snippet, ISR config, draft preview setup.	1–2 hours
API Reference	Every endpoint, request/response examples, multi-language snippets (curl, fetch, axios).	3–4 hours
Webhooks	How to configure, event list, HMAC signature verification, handling delivery failures.	1–2 hours
Field Types Reference	Table: every field type, its JSON shape in API response, validation options.	1 hour
Rate Limits	Per-plan limits, response headers (X-RateLimit-*), what the 429 looks like.	30 min
 
9. AI Features — Utility, Not Theater
AI is table stakes in 2026 for developer tools. But build it as genuine utility. Two features ship in Sprint 4; everything else is post-launch.

9.1 AI SEO Generator (Ship in Sprint 4)
•	On the entry edit page, "Generate with AI" button next to SEO Title and SEO Description
•	Uses Claude Haiku — cheap ($0.00025/1K input tokens), fast, accurate enough for SEO
•	Typical generation cost: < ₹0.08 — sell as AI credits at ₹800/100 credits → ~98% margin
•	Endpoint: POST /api/internal/ai/seo — accepts title + content preview, returns JSON with seoTitle + seoDescription

9.2 Content Type Generator (Ship in Sprint 4)
•	User types "I'm building an e-commerce site for handmade pottery" → AI generates full ContentType schema
•	Most powerful onboarding feature. Removes the blank-slate problem on first login.
•	Prompt: describe the use case, output valid JSON matching FieldDefinition[] shape
•	Gate behind PRO plan to drive upgrades

9.3 Content Suggestions (Post-launch, Month 2)
•	"Complete this sentence", "Make more concise", "Translate to [language]", "3 alternative headlines"
•	This is Notion AI scoped to structured CMS fields. Gate behind PRO plan.
•	Only build after Sprint 4 — do not get distracted by AI before the foundation is stable
 
10. What to Build After Launch (Months 2–6)

Month	Feature	Effort	Revenue Impact
Month 2	Overage billing ($0.002/request beyond limit)	1 day	Converts heavy Hobby users to PRO
Month 2	Custom API domain (api.yourclient.com)	2 days	Agency plan key differentiator
Month 2	Additional blocks: Video, Gallery, Columns, Table	3 days	Editor completeness
Month 3	GraphQL endpoint	5 days	Opens enterprise/agency market
Month 3	White-label dashboard (logo + domain)	3 days	Agency plan lock-in feature
Month 4	i18n / locale support	5 days	European market + multilingual clients
Month 4	Image transformations (width, format, quality)	2 days	Removes Cloudinary dependency for users
Month 5	SSO (SAML/OIDC)	5 days	Enterprise gate — unlocks $300+/month
Month 6	Block marketplace (community plugins)	2 weeks	Ecosystem flywheel — Year 2 moat
 
11. Solo Founder Operating System
You are the PM, dev, designer, support, and marketer. These rules keep you from burning out and shipping the wrong things.

11.1 Daily Rules
1.	Start every day by reading Sentry. Fix errors before writing new code.
2.	One sprint goal per week. Write it on a sticky note. Do not add scope mid-sprint.
3.	Ship something visible every Friday. Even if small. Momentum is a solo founder's only asset.
4.	Do not reply to feature requests until Sprint 4 is done. Write them in a list. Prioritize post-launch.
5.	Test every feature on mobile before calling it done. Your users are not all on desktop.

11.2 Weekly Review (Friday, 30 minutes)
•	Did I ship the sprint goal? If not, why?
•	What broke this week that I didn't catch immediately?
•	Did any user email/DM me? What did they say?
•	What is the one thing that, if done next week, moves the needle most?

11.3 What NOT to Do Before Sprint 4 is Done
•	Do not add new blocks or UI polish — the infrastructure is broken
•	Do not start a social media presence you cannot maintain
•	Do not pitch to enterprise customers without SSO and audit logs
•	Do not refactor the codebase — ship, then refactor once you have users to tell you what actually matters
•	Do not build mobile SDKs — zero demand signal yet

The single most important metric for the next 4 weeks: number of workspaces with a connected paid subscription. Everything else is vanity.
 
12. Launch Readiness Checklist
Do not announce or launch until every item in Sprint 1 and 2 is checked. The Sprint 3 and 4 items are strongly recommended.

Sprint 1 — Must Complete Before Taking Money
•	Supabase PgBouncer connection string active (port 6543)
•	Upstash Redis rate limiter deployed and tested
•	Razorpay checkout session creation working
•	Razorpay webhook handler processing subscription.activated events
•	/settings/billing page shows current plan and working upgrade button
•	Workspace rename and delete working
•	Cloudflare Cache Rule created (Authorization header stripped from cache key)

Sprint 2 — Must Complete Before Beta
•	Sentry installed and receiving errors from API routes
•	QStash processing webhook delivery and usage increment jobs
•	Team invitation email sending via Resend
•	Usage dashboard chart connected to real UsageLog data
•	Draft tokens created and ?_token= preview working in API
•	Audit log entries being written on publish/delete/key events

Sprint 3 & 4 — Strongly Recommended for Launch
•	At least 6 content type templates available in "New Content Type" modal
•	At least 3 page templates available in block editor
•	Quote and Code blocks working in the editor
•	Environments (staging/prod) available for PRO/AGENCY plans
•	Quick Start documentation page live at /docs
•	Next.js integration guide live at /docs/integrations/nextjs
•	Loom demo video recorded (max 5 minutes, show the full create → API loop)
•	Landing page upgrade buttons are all connected to Razorpay checkout



FlowCMS — Solo Founder Implementation Plan v1.0
May 2026  ·  Confidential  ·  Single developer execution path for z
