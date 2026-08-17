# Cloudflare Production Setup Guide

To achieve the performance and security targets defined in the Master Implementation Blueprint, follow these configuration steps in your Cloudflare Dashboard.

## 1. Cache Rule: Ignore Authorization Header
By default, Cloudflare may vary the cache based on the `Authorization` header, or refuse to cache requests that contain it. We want to cache public API responses (like `/entries`) regardless of the API key used, provided the content is the same.

**Instructions:**
1. Go to **Caching** > **Cache Rules**.
2. Click **Create rule**.
3. **Rule Name:** `Ignore Authorization for API V1`.
4. **When incoming requests match:**
   - Field: `URI Path`
   - Operator: `starts with`
   - Value: `/api/v1/`
5. **Then:**
   - **Cache Eligibility:** `Eligible for cache`
   - **Edge TTL:** `Override origin` -> `2 hours` (or as preferred)
   - **Browser TTL:** `Override origin` -> `1 hour`
   - **Cache Key (Critical):**
     - Click **Advanced**.
     - Under **Headers**, ensure "Include all headers" is **NOT** checked.
     - Specifically ensure `Authorization` is **NOT** part of the cache key.
6. Click **Deploy**.

---

## 2. Edge Enforcement Layer (Cloudflare Worker)
This worker sits in front of your cache. It validates API keys and checks rate limits via Upstash Redis before Cloudflare serves a cached response.

### Deployment Instructions:
1. Create a new Worker in Cloudflare.
2. Paste the following code:

```typescript
// cloudflare-worker.ts
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Only protect V1 API routes
    if (!url.pathname.startsWith("/api/v1/")) {
      return fetch(request);
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing API Key", code: "UNAUTHORIZED" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const apiKey = authHeader.split(" ")[1];

    // --- 1. Rate Limiting via Upstash ---
    // Note: We use the Upstash REST API for Edge compatibility
    const UPSTASH_URL = env.UPSTASH_REDIS_REST_URL;
    const UPSTASH_TOKEN = env.UPSTASH_REDIS_REST_TOKEN;

    const rateLimitKey = `rl:${apiKey}`;
    const rateLimitRes = await fetch(`${UPSTASH_URL}/incr/${rateLimitKey}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
    });
    
    const count = (await rateLimitRes.json()).result;
    
    // Set expiry on first request (simple window)
    if (count === 1) {
      await fetch(`${UPSTASH_URL}/expire/${rateLimitKey}/60`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
      });
    }

    if (count > 100) { // Default limit, can be fetched from Redis per-key
      return new Response(JSON.stringify({ error: "Rate limit exceeded", code: "RATE_LIMITED" }), {
        status: 429,
        headers: { "Content-Type": "application/json" }
      });
    }

    // --- 2. Proceed to Origin/Cache ---
    // The actual API key validation still happens at the Origin in Sprint 1.
    // In Sprint 2, we will move Key Validation to the Edge by syncing hashes to Redis.
    return fetch(request);
  }
}
```

3. Configure Environment Variables in the Worker settings:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

---

## 3. SSL/TLS Settings
Ensure your SSL/TLS encryption mode is set to **Full (Strict)** to protect the API keys in transit between Cloudflare and Vercel/Supabase.
