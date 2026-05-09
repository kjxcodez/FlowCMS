import { NextRequest } from "next/server";

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
  
  // CRITICAL: Prevent Cloudflare from serving the same response to different API keys
  headers.set("Vary", "Authorization, Accept-Encoding");
  
  return headers;
}

/**
 * Returns tags for Cloudflare Cache-Tag header.
 * Allows purging all entries for a specific workspace or content type.
 */
export function getCacheTags(workspaceId: string, extraTags: string[] = []) {
  return [`ws:${workspaceId}`, ...extraTags].join(",");
}
