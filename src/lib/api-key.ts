import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { prisma } from "./prisma";
import crypto from "crypto";
import { cached } from "./cache";

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

export async function verifyApiKey(raw: string): Promise<{
  valid: boolean;
  workspaceId: string;
  plan: string;
  apiKeyId: string;
} | null> {
  const prefix = raw.slice(0, 8);
  // const cacheKey = `auth:key:${raw}`; // Using the raw key as part of the cache key (risky? No, it's a secure token)
  // Actually, better to cache by the hash of the raw key to avoid storing raw keys in Redis.
  const secureCacheKey = `auth:key:v1:${crypto.createHash("sha256").update(raw).digest("hex")}`;

  return cached(secureCacheKey, 300, async () => {
    const candidates = await prisma.apiKey.findMany({
      where: { keyPrefix: prefix },
      include: {
        workspace: { select: { id: true, plan: true } },
      },
    });

    for (const key of candidates) {
      let match = false;

      if (key.keyHash.startsWith("sha256:")) {
        const hash = crypto.createHash("sha256").update(raw).digest("hex");
        match = `sha256:${hash}` === key.keyHash;
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

        return {
          valid: true,
          workspaceId: key.workspaceId,
          plan: key.workspace.plan,
          apiKeyId: key.id,
        };
      }
    }

    return null;
  });
}
