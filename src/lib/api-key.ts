import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { prisma } from "./prisma";
import crypto from "crypto";
import { invalidateCache, redis } from "./cache";
import { logger } from "./logger";

/** Generate a new API key: flw_<32 random chars> */
export function generateApiKey(): { raw: string; prefix: string } {
  const raw = `flw_${nanoid(32)}`;
  return { raw, prefix: raw.slice(0, 8) };
}

export function hashApiKey(raw: string): string {
  // Switch to SHA-256 for performance. Prefix with "sha256:" to distinguish from legacy bcrypt.
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return `sha256:${hash}`;
}

export async function invalidateApiKeyCache(id: string, keyHash: string): Promise<void> {
  const idMappingKey = `auth:key-id:v1:${id}`;
  try {
    const cacheKey = await redis.get<string>(idMappingKey);
    if (cacheKey) {
      await invalidateCache(cacheKey);
      await invalidateCache(idMappingKey);
    }
    if (keyHash.startsWith("sha256:")) {
      const hash = keyHash.replace("sha256:", "");
      await invalidateCache(`auth:key:v1:${hash}`);
    }
  } catch (err) {
    logger.error("Failed to invalidate API key cache", { id, error: String(err) });
  }
}

export async function verifyApiKey(raw: string): Promise<{
  valid: boolean;
  workspaceId: string;
  environmentId: string | null;
  plan: string;
  apiKeyId: string;
  scopes: string[];
  expiresAt?: Date | null;
} | null> {
  const prefix = raw.slice(0, 8);
  const secureCacheKey = `auth:key:v1:${crypto.createHash("sha256").update(raw).digest("hex")}`;

  try {
    const cachedData = await redis.get<any>(secureCacheKey);
    if (cachedData !== null) {
      if (cachedData.expiresAt && new Date(cachedData.expiresAt) < new Date()) {
        logger.warn("Cached API key has expired", { apiKeyId: cachedData.apiKeyId });
        await invalidateCache(secureCacheKey).catch(() => {});
        return null;
      }
      return cachedData;
    }
  } catch (err) {
    logger.error("Redis cache get error in verifyApiKey", { error: String(err) });
  }

  const candidates = await prisma.apiKey.findMany({
    where: { keyPrefix: prefix },
    include: {
      workspace: { select: { id: true, plan: true } },
    },
  });

  for (const key of candidates) {
    if (key.expiresAt && key.expiresAt < new Date()) {
      logger.warn("Expired API key used", { keyId: key.id });
      continue;
    }

    let match = false;

    if (key.keyHash.startsWith("sha256:")) {
      const hash = crypto.createHash("sha256").update(raw).digest("hex");
      const expectedHash = `sha256:${hash}`;
      
      // Timing-safe comparison
      const a = Buffer.from(expectedHash);
      const b = Buffer.from(key.keyHash);
      
      if (a.length !== b.length) {
        match = false;
      } else {
        match = crypto.timingSafeEqual(a, b);
      }
    } else {
      // Fallback for legacy bcrypt keys
      match = await bcrypt.compare(raw, key.keyHash);
    }

    if (match) {
      // Update last used timestamp in the background
      prisma.apiKey
        .update({
          where: { id: key.id },
          data: { lastUsedAt: new Date() },
        })
        .catch(() => {});

      const result = {
        valid: true,
        workspaceId: key.workspaceId,
        environmentId: key.environmentId,
        plan: key.workspace.plan,
        apiKeyId: key.id,
        scopes: key.scopes,
        expiresAt: key.expiresAt,
      };

      let ttl = 300;
      if (key.expiresAt) {
        const msToExpiry = key.expiresAt.getTime() - Date.now();
        if (msToExpiry <= 0) {
          return null;
        }
        ttl = Math.min(ttl, Math.ceil(msToExpiry / 1000));
      }

      try {
        await redis.set(secureCacheKey, result, { ex: ttl });
        await redis.set(`auth:key-id:v1:${key.id}`, secureCacheKey, { ex: ttl });
      } catch (err) {
        logger.error("Redis cache set error in verifyApiKey", { error: String(err) });
      }

      return result;
    }
  }

  return null;
}
