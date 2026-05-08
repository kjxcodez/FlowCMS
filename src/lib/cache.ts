interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/** Get a value from cache, or compute and store it */
export async function cached<T>(
  key: string,
  ttlMs: number,
  compute: () => Promise<T>
): Promise<T> {
  const existing = cache.get(key) as
    | CacheEntry<T>
    | undefined;

  if (existing && Date.now() < existing.expiresAt) {
    return existing.data;
  }

  const data = await compute();
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}

/** Invalidate a specific key or all keys matching a prefix */
export function invalidateCache(keyOrPrefix: string): void {
  if (cache.has(keyOrPrefix)) {
    cache.delete(keyOrPrefix);
    return;
  }
  // Prefix invalidation
  for (const key of cache.keys()) {
    if (key.startsWith(keyOrPrefix)) {
      cache.delete(key);
    }
  }
}
