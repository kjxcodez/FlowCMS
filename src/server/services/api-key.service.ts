import crypto from "crypto";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { cached } from "@/lib/cache";
import { emitPlatformEvent, PLATFORM_EVENTS } from "../events/emitter";

export class ApiKeyService {
  /**
   * Generates a secure raw API key: flw_<32 random chars>
   */
  static generateApiKey(): { raw: string; prefix: string } {
    const raw = `flw_${nanoid(32)}`;
    return { raw, prefix: raw.slice(0, 8) };
  }

  /**
   * Hashes the raw token using SHA-256 for secure database verification.
   */
  static hashApiKey(raw: string): string {
    const hash = crypto.createHash("sha256").update(raw).digest("hex");
    return `sha256:${hash}`;
  }

  /**
   * Creates a new API Key record and triggers event audits.
   */
  static async createApiKey(workspaceId: string, name: string, userId: string, scopes?: string[], environmentId?: string) {
    const count = await prisma.apiKey.count({
      where: { workspaceId },
    });
    if (count >= 5) {
      throw new Error("PLAN_LIMIT_REACHED: Maximum 5 API keys allowed.");
    }

    let finalEnvId = environmentId;
    if (!finalEnvId) {
      const defaultEnv = await prisma.environment.findFirst({
        where: { workspaceId, slug: "production" },
      });
      if (defaultEnv) {
        finalEnvId = defaultEnv.id;
      }
    }

    const { raw, prefix } = this.generateApiKey();
    const keyHash = this.hashApiKey(raw);

    const key = await prisma.apiKey.create({
      data: {
        workspaceId,
        environmentId: finalEnvId || null,
        name,
        keyHash,
        keyPrefix: prefix,
        scopes: scopes || ["read:entries", "read:media"],
      },
    });

    // Emit event for auditing
    emitPlatformEvent(PLATFORM_EVENTS.API_KEY_CREATED, {
      workspaceId,
      userId,
      keyId: key.id,
      keyName: key.name,
    });

    return { rawKey: raw, key };
  }

  /**
   * Revokes an existing API Key.
   */
  static async revokeApiKey(workspaceId: string, id: string, userId: string) {
    const result = await prisma.apiKey.deleteMany({
      where: { id, workspaceId },
    });
    if (!result.count) {
      throw new Error("NOT_FOUND: API key not found.");
    }

    // Emit event for auditing
    emitPlatformEvent(PLATFORM_EVENTS.API_KEY_REVOKED, {
      workspaceId,
      userId,
      keyId: id,
    });

    return { deleted: true };
  }

  /**
   * Verifies a raw token against stored API key hashes using timing-safe comparisons.
   */
  static async verifyApiKey(raw: string): Promise<{
    valid: boolean;
    workspaceId: string;
    environmentId: string | null;
    plan: string;
    apiKeyId: string;
    scopes: string[];
  } | null> {
    const prefix = raw.slice(0, 8);
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
          const expectedHash = `sha256:${hash}`;
          
          const a = Buffer.from(expectedHash);
          const b = Buffer.from(key.keyHash);
          
          if (a.length !== b.length) {
            match = false;
          } else {
            match = crypto.timingSafeEqual(a, b);
          }
        } else {
          // Fallback legacy bcrypt
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
            environmentId: key.environmentId,
            plan: key.workspace.plan,
            apiKeyId: key.id,
            scopes: key.scopes,
          };
        }
      }

      return null;
    });
  }
}
