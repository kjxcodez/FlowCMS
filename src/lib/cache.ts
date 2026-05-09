import { Redis } from "@upstash/redis";
import { logger } from "./logger";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/** Get a value from Redis cache, or compute and store it */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>
): Promise<T> {
  try {
    const existing = await redis.get<T>(key);
    if (existing !== null) {
      return existing;
    }
  } catch (err) {
    logger.error("Redis cache get error", { key, error: String(err) });
  }

  const data = await compute();

  try {
    await redis.set(key, data, { ex: ttlSeconds });
  } catch (err) {
    logger.error("Redis cache set error", { key, error: String(err) });
  }

  return data;
}

/** Invalidate a specific key */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    logger.error("Redis cache delete error", { key, error: String(err) });
  }
}
