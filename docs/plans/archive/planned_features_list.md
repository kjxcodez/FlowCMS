Here's everything — complete feature list first, then FAQ gaps, then the full analysis.

---

## Complete FlowCMS Feature List

### TIER 1 — Must have before charging anyone

---

**1. CLI Tool (`flowcms` npm package)**

**Why:** Every serious developer tool has a CLI. Without it, FlowCMS feels incomplete. Your FAQ already promises `flowcms import --from sanity` — this is currently a lie.

**Pain point it solves:** Developers hate clicking through UIs to do things that should be scriptable. Seeding data, importing from another CMS, generating TypeScript types — these belong in a terminal.

**How to build:** Publish `@flowcms/cli` to npm. Start with four commands:
```
flowcms init          — scaffold a new project, generate .env template
flowcms import        — import from Sanity, Contentful, Strapi, or JSON
flowcms export        — export all content as JSON or CSV
flowcms types         — generate TypeScript types from your schema
```

**Benefits:** Massive DX improvement. Developers will mention it in tweets. "It just generates types from your schema" is a shareable moment.

**When:** Sprint 3. The `import` command is the most urgent because the FAQ already promises it.

---

**2. TypeScript SDK (`@flowcms/client`)**

**Why:** "Framework-agnostic REST API" is true but cold. Developers working in TypeScript want a typed client, not raw `fetch` calls. This is the difference between FlowCMS feeling like a tool vs a service.

**Pain point it solves:** Writing `fetch('/api/v1/entries/blog-post')` and manually typing the response is friction. Every developer does this once, sighs, and wishes there was an SDK.

**How to build:**
```typescript
import { createClient } from '@flowcms/client';

const cms = createClient({
  workspace: 'my-workspace',
  apiKey: process.env.FLOWCMS_API_KEY,
});

// Fully typed based on your schema
const posts = await cms.entries('blog-post').published().locale('en').fetch();
const page = await cms.pages('home').fetch();
```

**Benefits:** Auto-complete in IDE, compile-time errors for wrong field names, zero need to read docs for basic operations.

**When:** Sprint 4. Pair it with the type generator in the CLI.

---

**3. Next.js Integration Package (`@flowcms/next`)**

**Why:** Your primary audience is Next.js developers. Give them first-class primitives.

**Pain point it solves:** Setting up ISR, draft mode, and image optimization with a headless CMS requires boilerplate that every developer writes from scratch.

**How to build:**
```typescript
// app/blog/[slug]/page.tsx
import { getEntry, generateStaticParams } from '@flowcms/next';

export { generateStaticParams }; // auto-generates paths from all published entries

export default async function BlogPost({ params }) {
  const post = await getEntry('blog-post', params.slug);
  return <article>{/* render post */}</article>;
}
```

Also include:
- `<FlowImage>` — wrapper around `next/image` pre-configured with Supabase Storage domain
- `useDraftMode()` hook for preview mode integration
- `revalidateFlowCMS()` — webhook handler for on-demand ISR

**Benefits:** A developer can go from zero to a working Next.js blog in 15 minutes. That 15-minute demo is your best marketing asset.

**When:** Sprint 4.

---

**4. Content Export & Portability**

**Why:** Your FAQ promises it. "You can export everything at any time via our CLI or REST API." Neither currently exists in full.

**Pain point it solves:** Vendor lock-in fear is the number one reason developers choose self-hosted tools. Proving you can leave is what makes people stay.

**How to build:**
- `GET /api/internal/workspaces/[id]/export` — returns ZIP with all content types, entries, pages, and media metadata as JSON
- CLI: `flowcms export --format json --output ./backup`
- Schedule: allow automated daily exports to S3/Cloudflare R2

**Benefits:** Trust signal. Every competitor buries this. FlowCMS should advertise it prominently.

**When:** Sprint 2 (basic JSON export). Full CLI export in Sprint 3.

---

**5. Content Import & Migration**

**Why:** The FAQ specifically promises `flowcms import --from sanity`. This is your acquisition strategy — every developer frustrated with Sanity's pricing is a target.

**Pain point it solves:** Migrating CMS is painful. Schema differences, field type mismatches, media re-uploading. Developers avoid migrating even when they hate their current tool because the migration cost is too high.

**How to build (phased):**

Phase 1 — JSON import (Sprint 3):
```
flowcms import --file ./export.json --type entries
```

Phase 2 — Sanity migration (Sprint 4):
```
flowcms import --from sanity --project-id abc123 --dataset production
```
Use Sanity's export API to pull NDJSON, map their schema types to FlowCMS field types, handle references and asset uploads.

Phase 3 — Contentful, Strapi (Post-launch):
Each has its own export format. Contentful is the most valuable target.

**Field type mapping for Sanity:**
```
sanity: string      → flowcms: text
sanity: text        → flowcms: textarea  
sanity: blockContent → flowcms: richtext
sanity: image       → flowcms: media
sanity: reference   → flowcms: reference
sanity: array       → flowcms: multiple
```

**When:** Phase 1 Sprint 3, Phase 2 Sprint 4.

---

### TIER 2 — Core product completeness

---

**6. Full HTML Page Builder with Fetch**

**Why:** This is the feature you specifically called out. Agencies and marketers want to build complete HTML pages visually, not just supply JSON to a developer's frontend. This closes the gap between "headless CMS" and "complete website builder."

**Pain point it solves:** Many clients do not have a frontend developer. They need a CMS that can also serve the page, not just the data.

**How to build:**

The Page model already stores blocks as JSON. The new addition is:

- A `GET /api/v1/pages/[slug]/html` endpoint that renders the blocks server-side into a complete HTML document using a template
- Custom CSS field per page for styling overrides
- A `<head>` section editor for meta tags, scripts, and stylesheets
- An iframe preview in the editor that calls this endpoint live

```typescript
// GET /api/v1/pages/[slug]/html
// Returns a complete HTML document, not JSON
export async function GET(req, { params }) {
  const page = await getPublishedPage(params.slug);
  const html = renderPageToHTML(page); // server-side block rendering
  return new Response(html, {
    headers: { 'Content-Type': 'text/html', 'Cache-Control': 'public, s-maxage=60' }
  });
}
```

**Benefits:** Agencies can host client landing pages entirely on FlowCMS with zero frontend infrastructure. A client gets a URL, not an API endpoint.

**Plan gate:** Pro and above.

**When:** Sprint 5. This is a significant feature — block renderer, HTML template engine, CSS isolation.

---

**7. Media Management (Digital Asset Manager)**

**Why:** The Media model exists but there is no proper DAM UI. Developers need to browse, organize, search, and reference media across entries.

**Pain point it solves:** Every CMS without a proper media library forces developers to use Cloudinary or S3 separately, adding cost and complexity.

**How to build:**
- Folder tree navigation (already have `folder` field on Media)
- Drag-and-drop upload with progress
- Image preview with dimensions and file size
- Bulk operations: delete, move to folder, download
- Search by filename and alt text
- Image transformation URL params: `?w=800&h=600&fit=cover&format=webp`
- Usage tracking: show which entries reference each media item

**Benefits:** Eliminates Cloudinary dependency for most users. Image transformation alone justifies Pro plan.

**When:** Sprint 3 (basic DAM). Image transformations Sprint 5.

---

**8. Scheduled Publishing**

**Why:** This is table stakes for any publishing workflow. Contentful has had it since day one.

**Pain point it solves:** Editors write content in advance but cannot schedule it to go live at a specific time without developer involvement. This creates a bottleneck where editors ping developers every time they need to publish outside business hours.

**How to build:**
- Add `scheduledAt DateTime?` to `Entry` and `Page` models
- QStash delayed message: when saving with `scheduledAt`, enqueue a job with delay
- The job changes `status` to `PUBLISHED` and fires webhooks
- Show scheduled entries in a dedicated "Scheduled" filter in the dashboard
- Calendar view showing upcoming scheduled publishes

```typescript
// When editor sets scheduledAt:
await qstash.publishJSON({
  url: `${APP_URL}/api/jobs/publish`,
  body: { entryId: entry.id },
  delay: Math.floor((scheduledAt.getTime() - Date.now()) / 1000),
});
```

**Benefits:** Removes developers from the publishing loop entirely. This is what editorial teams actually care about.

**Plan gate:** Pro and above.

**When:** Sprint 4.

---

**9. Content Versioning & History**

**Why:** The `version` field exists on `Entry` but there is no version history UI or rollback. This is dangerous — an editor who overwrites content has no recovery path.

**Pain point it solves:** "I accidentally deleted a paragraph and saved" is a support ticket that happens weekly at every company using a CMS.

**How to build:**
- `EntryVersion` model storing snapshots: `{ entryId, version, data, savedBy, savedAt }`
- Every save increments `version` and creates an `EntryVersion` record
- Version history panel in the editor showing timeline of changes
- Diff view: highlight what changed between versions
- One-click restore to any previous version

**Plan gate:** Hobby gets last 3 versions. Pro gets 30 days of history. Agency gets unlimited.

**When:** Sprint 5.

---

**10. Webhook System (complete)**

**Why:** The schema has webhooks but the delivery system needs to be production-grade.

**Pain point it solves:** Developers building JAMstack sites need reliable webhook delivery to trigger rebuilds. A missed webhook means stale content that nobody notices for days.

**How to build (additions to current):**
- Delivery logs UI showing last 50 deliveries per webhook with status codes and response times
- Manual retry button for failed deliveries
- Automatic retry with exponential backoff (already in QStash)
- Webhook secret verification guide in docs
- Test payload button — send a sample payload without publishing

**Benefits:** Developers trust the system when they can see delivery logs. This is a reliability signal.

**When:** Sprint 3.

---

**11. Reference Fields (Content Relationships)**

**Why:** Almost every real content model needs references. Blog posts reference authors. Products reference categories. Without this, FlowCMS cannot model real-world content.

**Pain point it solves:** Currently there is no way to link one entry to another. Every developer trying to model "Author" as a separate content type and reference it from "Blog Post" hits a wall.

**How to build:**
- New field type: `reference` — selects an entry from a specified content type
- API response includes the referenced entry inline (with depth limit) or as an ID
- `populate` query param: `?populate=author,category` to inline references
- Circular reference detection in the schema editor

**When:** Sprint 4. This is a significant schema and API change.

---

**12. Localization (i18n)**

**Why:** The `localeCode` field already exists. This needs a full implementation.

**Pain point it solves:** Any developer building for a non-English audience needs localization. The current half-implementation creates false expectations.

**How to build:**
- Workspace-level locale configuration: define supported locales and a default
- Per-entry locale variants: same content type, different locale, linked together
- API: `GET /v1/entries/blog-post?locale=fr` with EN fallback
- Translation completeness indicator in the dashboard
- "Copy from [default locale]" button to pre-fill translations

**Plan gate:** Hobby gets 1 locale (EN). Pro gets 5 locales. Agency gets unlimited.

**When:** Sprint 6. Do not ship partial — either it works end-to-end or do not ship.

---

### TIER 3 — Developer experience differentiators

---

**13. GraphQL API**

**Why:** REST is fine but GraphQL lets developers fetch exactly what they need with one request. Over-fetching is a real problem for complex pages with many content types.

**Pain point it solves:** A page that needs 5 different content types requires 5 REST calls. GraphQL collapses this to one.

**How to build:**
- Auto-generate GraphQL schema from content type definitions
- Single endpoint: `POST /api/v1/graphql`
- Support for nested reference resolution
- GraphQL Playground available at `/docs/graphql`

**Plan gate:** Pro and above.

**When:** Sprint 7. This is 5+ days of work done right.

---

**14. Live Preview (real-time)**

**Why:** Draft tokens exist but the preview is a separate browser tab. Real-time preview means the editor sees changes as they type, in context.

**Pain point it solves:** The editing loop is: type → save → switch tab → refresh → switch back. This is slow and breaks focus.

**How to build:**
- Preview panel inside the editor (resizable iframe)
- Postmessage API between editor and preview iframe
- Developer adds `<FlowCMSLivePreview>` wrapper to their frontend
- Changes stream in real-time without saving

**When:** Sprint 5.

---

**15. AI Content Generation (complete suite)**

**Why:** AI is expected in every content tool in 2025. It needs to go beyond SEO metadata.

**Features to build:**

| Feature | Trigger | Model | Plan gate |
|---|---|---|---|
| SEO metadata generator | Button next to SEO fields | Gemini Flash | Pro |
| Schema generator | "Describe what you're building" in onboarding | Gemini Flash | All |
| Content completion | Tab key in text fields | Gemini Flash | Pro |
| Headline variants | Right-click menu on heading | Gemini Flash | Pro |
| Translation | "Translate to [locale]" button | Gemini Flash | Pro |
| Content summary | Auto-generate excerpt from body | Gemini Flash | All |
| Alt text generator | Auto-suggest when uploading image | Gemini Flash | All |
| Tone rewriter | "Make formal / casual / concise" | Gemini Flash | Pro |

**When:** SEO generator and schema generator Sprint 4. Others Sprint 6.

---

**16. API Playground (in-dashboard)**

**Why:** Developers need to test API calls without leaving the dashboard. Currently they have to use Postman or curl.

**Pain point it solves:** Every time a developer wants to test a query they have to copy their API key, open another tool, and construct the request manually.

**How to build:**
- Interactive UI at `/dashboard/api-explorer`
- Pre-populated with workspace API key
- Shows all available content types as endpoints
- Query param builder (status, locale, limit, offset)
- Response viewer with syntax highlighting
- "Copy as curl" and "Copy as fetch" buttons
- Shows response time and cache status

**When:** Sprint 4. This is a high-visibility DX win that developers will screenshot and share.

---

**17. Webhooks Outgoing + Incoming (Event Triggers)**

**Why:** Beyond outgoing webhooks for publish events, developers need incoming webhooks to trigger content actions from external systems.

**Pain point it solves:** A developer running a CI/CD pipeline cannot trigger a content publish from their deployment script.

**How to build:**
- Incoming webhook URL: `POST /api/v1/triggers/[workspace]/[secret]`
- Configurable actions: publish entry, invalidate cache, run export
- Signed with HMAC to prevent abuse

**When:** Sprint 6.

---

**18. Environments with Promotion Flow**

**Why:** The environment model exists but there is no "promote from staging to production" workflow.

**Pain point it solves:** Developers manually copy content between environments. This is error-prone and time-consuming.

**How to build:**
- "Promote to production" button on any entry in staging
- Diff view showing what will change before promotion
- Bulk promotion: promote all approved entries at once
- Promotion audit log: who promoted what and when

**When:** Sprint 5.

---

### TIER 4 — Agency and team features

---

**19. White-label Dashboard**

**Why:** Agencies resell CMS access to clients. They need their logo, their domain, not FlowCMS branding.

**Pain point it solves:** An agency cannot charge ₹5,000/month for "FlowCMS access." They can charge for "our proprietary CMS platform."

**How to build:**
- Custom logo upload in workspace settings
- Custom primary color for dashboard UI
- Custom domain mapping: `cms.yourclient.com` → FlowCMS dashboard
- Remove all FlowCMS branding from dashboard and emails

**Plan gate:** Agency only.

**When:** Sprint 7.

---

**20. Content Approval Workflow**

**Why:** Teams need editorial review before publishing. An editor submits, a senior editor approves, then it publishes.

**Pain point it solves:** Without this, any editor can publish anything immediately. Enterprise and agency customers require review workflows.

**How to build:**
- New entry status: `IN_REVIEW`
- "Submit for review" button for Editor role
- Review queue for Admin/Owner role
- Comments on entries: reviewers leave feedback inline
- Approval triggers publish or returns to draft with comments

**Plan gate:** Agency and Enterprise.

**When:** Sprint 8.

---

**21. Multi-workspace Management**

**Why:** Agencies managing 5+ client sites need a bird's-eye view, not 5 separate logins.

**Pain point it solves:** Switching between client workspaces is friction. Agencies want one dashboard showing all clients.

**How to build:**
- Workspace switcher in the sidebar (already has UI scaffolding)
- Workspace overview page: content counts, last activity, plan status per workspace
- Cross-workspace search (Agency plan)
- Bulk operations across workspaces

**When:** Sprint 5.

---

**22. Custom Roles and Permissions**

**Why:** The current roles (OWNER/ADMIN/EDITOR/VIEWER) are too coarse for real teams.

**Pain point it solves:** A client should be able to edit blog posts but not touch the product pages. There is no way to scope editor permissions by content type.

**How to build:**
- Role editor: define which content types each role can read/write/publish
- Per-content-type permissions matrix
- API key scopes: limit a key to specific content types

**Plan gate:** Enterprise.

**When:** Sprint 9.

---

### TIER 5 — Infrastructure and platform

---

**23. Edge Caching with Automatic Invalidation**

**Why:** The caching layer is implemented but invalidation on publish is manual. Developers should never have to think about cache.

**How it should work:** Publish an entry → Cloudflare cache purged → Next.js data cache revalidated → webhooks fired → all automatically, with no developer intervention.

**Status:** Partially implemented. The `purgeCacheTags` function exists but `revalidateTag` was missing (flagged in audit). This is being fixed.

**When:** Current sprint (part of blocker fixes).

---

**24. Image Transformation Pipeline**

**Why:** Serving raw uploaded images is wasteful. A 4MB DSLR photo should not be served to a mobile browser.

**Pain point it solves:** Developers write custom image resizing logic or pay for Cloudinary. Both add complexity and cost.

**How to build:**
- URL-based transformations: `?w=800&h=600&fit=cover&format=webp&q=80`
- Lazy processing: transform on first request, cache the result in Supabase Storage
- Automatic WebP/AVIF serving based on Accept header
- Blur hash generation on upload for low-quality placeholders

**Plan gate:** All plans (basic). Advanced transformations Pro+.

**When:** Sprint 6.

---

**25. Full-text Search API**

**Why:** Every content-heavy site needs search. Currently there is no way to search across entries via the API.

**Pain point it solves:** Developers implement their own search by fetching all entries and filtering client-side, which is slow and exposes all content.

**How to build:**
- `GET /api/v1/search?q=nextjs&types=blog-post,doc-page&locale=en`
- PostgreSQL full-text search using `tsvector` and `tsquery` (no additional infrastructure)
- Relevance scoring and result snippets
- Search within specific fields only

**Plan gate:** All plans. Advanced (fuzzy, faceted) Pro+.

**When:** Sprint 6.

---

**26. Status Page and Uptime Monitoring**

**Why:** Developers want to know if the CMS is down before their clients tell them.

**How to build:**
- Public status page at `status.getflowcms.com`
- Health checks every minute on API, database, and email
- Incident history
- Subscribe to incidents via email

**When:** Sprint 7. Use Betteruptime or build minimal custom version.

---

## FAQ Gaps — Features Promised But Not Built

Here are every promise in the current FAQs and their build status:

---

**FAQ: "flowcms import --from sanity"**

Not built. This is the most dangerous FAQ answer because it implies a working CLI. Remove the specific command from the FAQ until Sprint 4 when it exists. Replace with: *"Migration tooling is in active development. Early access members can request manual migration assistance."*

---

**FAQ: "Export via CLI or REST API"**

The REST export does not exist. The CLI does not exist. Change the answer to: *"Export via REST API is available. CLI export is on the roadmap for Q3 2026."*

---

**FAQ: "EU data residency"**

Currently you have one Supabase region. EU data residency requires a separate Supabase project in the EU region and routing logic to direct EU users to it. This is a significant infrastructure change. Remove this from the FAQ or qualify it as Enterprise-only and not yet available.

---

**FAQ: "Referral codes move you up the queue significantly"**

This is cosmetic right now (flagged in the referral audit). Change "significantly" to "your position is noted and considered during approval."

---

**Updated FAQ answers:**

```typescript
export const FAQS = [
  {
    question: "What makes FlowCMS different from Sanity or Strapi?",
    answer: "Unlike Sanity, FlowCMS is fully self-hostable and MIT-licensed with no vendor lock-in. Unlike Strapi, setup takes minutes not hours — no manual plugin configuration, no migrations to write. The block editor maps 1:1 to predictable JSON, so your frontend always knows the exact data shape."
  },
  {
    question: "How do I get early access?",
    answer: "Join the waitlist on the home page. We are inviting developers in small batches based on use case fit. Sharing your referral link moves your position up in the queue."
  },
  {
    question: "What does it cost?",
    answer: "FlowCMS core is MIT-licensed and free to self-host forever. Our managed cloud starts with a generous free Hobby tier. Pro is ₹1,999/month. The first 30 developers on the waitlist get one month of Pro free."
  },
  {
    question: "Who owns my content data?",
    answer: "You do, always. Export everything at any time as standard JSON via the REST API. Self-hosted users have complete control over their infrastructure and data location."
  },
  {
    question: "Can I self-host FlowCMS?",
    answer: "Yes. We provide an official Docker image. Run it with docker-compose up and it handles database migrations automatically. Full instructions are in our documentation."
  },
  {
    question: "Can I migrate from Sanity or Contentful?",
    answer: "JSON import is available now. A CLI migration tool for Sanity and Contentful is in development and will be available to early access members first."
  },
  {
    question: "Is FlowCMS GDPR compliant?",
    answer: "Yes. Self-hosted users control their own data location entirely. For cloud users, data is stored in secure infrastructure. Enterprise customers can request custom data residency arrangements."
  },
  {
    question: "What are the API rate limits?",
    answer: "Self-hosted: no limits beyond your hardware. Cloud Hobby: 5,000 requests/month. Pro: 250,000/month. Agency: 1,000,000/month pooled across workspaces."
  },
  {
    question: "Which frameworks work with FlowCMS?",
    answer: "Any framework that can make an HTTP request. We have first-class support for Next.js with a dedicated integration package. REST API works equally well with Remix, Astro, Vue, SvelteKit, React Native, Swift, and Kotlin."
  },
  {
    question: "How does the block editor map to the API?",
    answer: "Every block is a typed JSON object with a predictable shape. Publish a page and the API returns an array of blocks your frontend renders. No custom parsers, no Portable Text, no GROQ — just JSON you already know how to use."
  }
];
```

---

## Feature Priority Matrix

| Feature | Effort | Revenue impact | DX impact | When |
|---|---|---|---|---|
| CLI tool (init + types) | Medium | High | Very high | Sprint 3 |
| TypeScript SDK | Medium | High | Very high | Sprint 4 |
| Content export | Low | Medium | High | Sprint 2 |
| Sanity import | High | Very high | High | Sprint 4 |
| Scheduled publishing | Medium | High | High | Sprint 4 |
| Reference fields | High | Very high | Very high | Sprint 4 |
| Full-text search | Medium | High | High | Sprint 6 |
| HTML page fetch | Medium | High | High | Sprint 5 |
| API Playground | Low | Medium | Very high | Sprint 4 |
| Image transforms | Medium | Medium | High | Sprint 6 |
| Content versioning | Medium | Medium | High | Sprint 5 |
| Localization | High | Very high | High | Sprint 6 |
| GraphQL | Very high | High | Medium | Sprint 7 |
| Live preview | Medium | Medium | Very high | Sprint 5 |
| White-label | Medium | Very high | Low | Sprint 7 |
| Approval workflow | High | High | Medium | Sprint 8 |
| Custom roles | Very high | High | Medium | Sprint 9 |