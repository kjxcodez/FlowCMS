Every time the v1 APIs are hit. Here's the exact reasoning:

**Monthly API request count = every v1 API call, cached or not.**

The customer is paying for "5,000 API requests/month" — that means every time *their frontend/app* calls your API, it counts. Whether your system served it from cache in 8ms or hit the DB in 400ms is your internal infrastructure detail, not theirs. Contentful, Sanity, and every other CMS counts it this way.

So the flow is:

```
Request arrives → Cloudflare Worker runs →
  1. Check rate limit (Redis)       ← per-minute burst protection
  2. Increment monthly counter      ← always, before cache
  3. Check monthly limit            ← block if over 5,000/250,000/etc.
  4. Request proceeds to cache → Vercel → DB
```

---

**The write-time limits are completely separate things:**

| Counter | When incremented | What it protects |
|---|---|---|
| `apiRequests` (monthly) | Every v1 API hit, in the Worker | The "5,000/month" plan limit |
| `contentTypes` count | When user creates a content type | The "3 content types" plan limit |
| `webhooks` count | When user adds a webhook endpoint | The "5 webhooks" plan limit |
| `workspaces` count | When user creates a workspace | The "1/5 workspaces" plan limit |

They're not the same thing at all. Content type limits are about what you've *built*. API request limits are about how much *traffic* you're generating.

---

**One practical nuance — what counts as a "request"?**

You need to decide this explicitly and document it, because edge cases will cause support tickets:

```
✅ Counts:   GET /v1/entries/blog-post          (fetching content)
✅ Counts:   GET /v1/entries/blog-post/clx123   (single entry)
✅ Counts:   GET /v1/pages/home                 (fetching a page)
✅ Counts:   GET /v1/media                      (fetching media list)

❌ No count: Dashboard API calls (/api/internal/*)  (that's you using your own product)
❌ No count: Webhook delivery attempts              (you firing to their server)
❌ No count: Failed auth (401) — debatable, but most CMSes don't count these
```

The simplest rule: **if it hits `/api/v1/*` with a valid API key, it counts.** Put that in your docs and support tickets disappear.





