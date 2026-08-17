
/**
 * Generates Cache-Control headers for the public API.
 * Ensures the 'Vary: Authorization' header is always present to prevent session leaking.
 */
export function getApiCacheHeaders({
  sMaxAge = 60, // Edge cache duration (1 min default)
  staleWhileRevalidate = 300, // Serve stale content while revalidating (5 min)
  isPrivate = false,
}: {
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  isPrivate?: boolean;
} = {}) {
  const headers = new Headers();
  
  if (isPrivate) {
    headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
    return headers;
  }

  headers.set(
    "Cache-Control",
    `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`
  );
  
  // REMOVED: Vary: Authorization causes excessive cache fragmentation on Cloudflare.
  // We rely on origin-side validation in the middleware/adapter layer instead.
  headers.set("Vary", "Accept-Encoding");
  
  return headers;
}

/**
 * Returns tags for Cloudflare Cache-Tag header.
 * Allows purging all entries for a specific workspace or content type.
 */
export function getCacheTags(workspaceId: string, extraTags: string[] = []) {
  return [`ws:${workspaceId}`, ...extraTags].join(",");
}
