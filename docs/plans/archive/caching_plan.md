Good — I have a complete picture now. Let me build the full caching guide with all layers explained clearly.Here's the full caching picture. Let me first diagram the entire request flow so the layers are visually clear, then explain exactly what to implement.There are four distinct cache layers. Here's exactly what to do at each one.

---

## Layer 1 — Cloudflare (most important, free)

This is your biggest win. A Cloudflare cache hit never touches Vercel at all. But there's a critical problem you need to know about first.

**The Authorization header problem:** If the request to your origin includes an Authorization header, in some cases the response will be BYPASS. Your API uses `Authorization: Bearer flw_...` — so Cloudflare will bypass the cache by default for every single API request. This kills Layer 1 entirely unless you work around it.

The fix is a Cloudflare Cache Rule that strips the Authorization header from the cache key and caches based on URL + workspace only. In your Cloudflare dashboard, go to **Caching → Cache Rules → Create rule**:

```
Rule name: FlowCMS API cache

When: URI Path matches /api/v1/*

Then:
  Cache eligibility: Eligible for cache
  Edge Cache TTL: Ignore cache-control header, use TTL: 60 seconds
  Browser TTL: Bypass cache (never cache in browser — API responses only)
  Cache Key: Custom
    → Remove: Authorization header from cache key
    → Include: URI path + query string
```

Then in your API route handlers, add the correct headers so Cloudflare knows what to cache:

```typescript
// src/app/api/v1/entries/[slug]/route.ts
export const GET = withApiAuth(async (req, { workspaceId }) => {
  // ... fetch logic ...

  return Response.json(data, {
    headers: {
      // s-maxage = Cloudflare/Vercel CDN TTL
      // stale-while-revalidate = serve stale while revalidating in background
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      // Tag this response so we can purge it surgically on publish
      'Cache-Tag': `workspace-${workspaceId},entries-${slug}`,
    }
  });
});
```

Cache Response Rules now let you modify Cache-Control directives, manage cache tags, and strip headers like Set-Cookie from origin responses before they reach Cloudflare's cache. This is available on the free plan.

**Cache purge on publish** — add this to your publish handler:

```typescript
// src/lib/cache.ts
export async function purgeCloudflareCache(tags: string[]) {
  if (!process.env.CF_ZONE_ID || !process.env.CF_API_TOKEN) return;

  await fetch(
    `https://api.cloudflare.com/client/v4/zones/${process.env.CF_ZONE_ID}/purge_cache`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tags }), // cache tag purge — free plan supports this
    }
  );
}

// Called when an entry is published
await purgeCloudflareCache([`workspace-${workspaceId}`, `entries-${contentTypeSlug}`]);
```

---

## Layer 2 — Vercel CDN (automatic, free)

Vercel's CDN caches your content in data centers around the world. CDN caching is available for all deployments and domains on your account, regardless of the pricing plan. For server responses to be successfully cached, the request must use GET or HEAD method, must not contain an Authorization header, and the response must not contain the set-cookie header.

The same `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` header you set above handles this automatically. When Cloudflare misses, Vercel's CDN catches it before the serverless function even wakes up.

---

## Layer 3 — Next.js data cache (`unstable_cache`)

This is for your database queries inside route handlers. When Layers 1 and 2 both miss (first request ever, or after a purge), the serverless function runs. You want the DB query itself cached so repeated cold-path requests within the same function instance don't re-query:

```typescript
// src/lib/queries.ts
import { unstable_cache } from 'next/cache';
import { prisma } from './prisma';

export const getPublishedEntries = unstable_cache(
  async (workspaceId: string, slug: string) => {
    return prisma.entry.findMany({
      where: {
        workspaceId,
        contentType: { slug },
        status: 'PUBLISHED',
      },
      orderBy: { updatedAt: 'desc' },
    });
  },
  ['entries'],  // base cache key
  {
    tags: ['entries'],  // used by revalidateTag
    revalidate: 60,     // fallback TTL in seconds
  }
);
```

Next.js 15 ships `revalidateTag` — tag your fetches with `next.tags` to enable on-demand cache invalidation. When your CMS publishes content, call `revalidateTag('entries')` and the edge instantly evicts that single item with no global purge and no downtime.

Add `revalidateTag` to your publish route handler:

```typescript
// src/app/api/internal/entries/[id]/route.ts
import { revalidateTag } from 'next/cache';

// When status changes to PUBLISHED:
revalidateTag(`entries-${workspaceId}`);
revalidateTag('entries');

// Also purge Cloudflare
await purgeCloudflareCache([`workspace-${workspaceId}`, `entries-${slug}`]);
```

---

## What TTL values to use

| Content type | Cloudflare TTL | Vercel TTL | Notes |
|---|---|---|---|
| Published entries | 60s | 60s | Short enough that a publish feels instant |
| Published pages | 60s | 60s | Same |
| Media metadata | 3600s | 3600s | Rarely changes |
| Content types schema | 300s | 300s | Schema changes are infrequent |
| Draft content (`?_token=`) | 0 — bypass cache | 0 | Never cache draft tokens |
| Internal dashboard API | bypass | bypass | Session-gated, never cache |

`stale-while-revalidate=300` on all of them means users always get an instant response even during the 60-second revalidation window. The 300-second stale window is the actual user-visible "freshness" — in practice a publish will purge both caches immediately anyway, so the TTL is just a safety net.

---

## What not to cache (just as important)

```typescript
// Internal dashboard routes — session-gated, never cache
return Response.json(data, {
  headers: { 'Cache-Control': 'private, no-store' }
});

// Draft preview endpoints
if (req.nextUrl.searchParams.has('_token')) {
  return Response.json(data, {
    headers: { 'Cache-Control': 'private, no-store, no-cache' }
  });
}
```

Any route under `/api/internal/*` should never be cached — they're behind session auth and return user-specific data. Same for any request with a `_token` draft parameter.

---

## Realistic latency with all layers active

Once everything is warm, here's what your users actually experience:

| Scenario | Latency | How often |
|---|---|---|
| Cloudflare HIT (content unchanged, repeat request) | 8–20ms | ~90% of traffic after warmup |
| Vercel CDN HIT (Cloudflare miss, first request to that PoP) | 30–60ms | ~8% |
| Next.js cache HIT (both CDNs miss, warm function) | 50–80ms | ~1.5% |
| Full DB query (cold start + cache miss) | 300–800ms | ~0.5% |

The goal is to make that 0.5% DB-query scenario happen only on first-ever requests and immediately after a publish. Every subsequent request for that content hits Cloudflare at sub-20ms.