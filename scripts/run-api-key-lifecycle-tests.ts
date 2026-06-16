import { prisma } from "../src/lib/prisma";
import { ApiKeyService } from "../src/server/services/api-key.service";
import { verifyApiKey, invalidateApiKeyCache } from "../src/lib/api-key";
import { redis } from "../src/lib/cache";
import crypto from "crypto";

async function runApiKeyLifecycleTests() {
  console.log("==================================================");
  console.log("   RUNNING FLOWCMS API KEY LIFECYCLE TESTS        ");
  console.log("==================================================");

  const suffix = Math.random().toString(36).substring(7);

  // 1. Seed Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: `Lifecycle WS ${suffix}`,
      slug: `lifecycle-ws-${suffix}`,
    },
  });

  // Seed default Environment
  const defaultEnv = await prisma.environment.create({
    data: {
      workspaceId: workspace.id,
      name: "Production",
      slug: "production",
      isDefault: true,
    },
  });

  // Seed a test user
  const user = await prisma.user.create({
    data: {
      email: `lifecycle-tester-${suffix}@example.com`,
      name: "Lifecycle Tester",
      emailVerified: true,
      onboarded: true,
    },
  });

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, message?: string) {
    if (condition) {
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${name}${message ? ` - ${message}` : ""}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // Test Case 1: Active Key Validation & Cache Seeding
    // ----------------------------------------------------
    {
      const { rawKey, key } = await ApiKeyService.createApiKey(
        workspace.id,
        "Active Key",
        user.id,
        ["read:entries"],
        defaultEnv.id
      );

      const res = await verifyApiKey(rawKey);
      assert(
        "Active key authenticates successfully",
        res !== null && res.valid === true && res.apiKeyId === key.id
      );

      // Verify that Redis keys exist
      const hash = crypto.createHash("sha256").update(rawKey).digest("hex");
      const secureCacheKey = `auth:key:v1:${hash}`;
      const idMappingKey = `auth:key-id:v1:${key.id}`;

      const cachedVal = await redis.get(secureCacheKey);
      const mappedVal = await redis.get(idMappingKey);

      assert(
        "Active key details are cached in Redis",
        cachedVal !== null && (cachedVal as any).apiKeyId === key.id
      );
      assert(
        "Key ID to cache key mapping exists in Redis",
        mappedVal === secureCacheKey
      );

      // Cleanup
      await ApiKeyService.revokeApiKey(workspace.id, key.id, user.id);
    }

    // ----------------------------------------------------
    // Test Case 2: Immediate Revocation Cache Invalidation
    // ----------------------------------------------------
    {
      const { rawKey, key } = await ApiKeyService.createApiKey(
        workspace.id,
        "Revocation Key",
        user.id,
        ["read:entries"],
        defaultEnv.id
      );

      // Validate to seed cache
      await verifyApiKey(rawKey);

      const hash = crypto.createHash("sha256").update(rawKey).digest("hex");
      const secureCacheKey = `auth:key:v1:${hash}`;
      const idMappingKey = `auth:key-id:v1:${key.id}`;

      // Revoke the key
      await ApiKeyService.revokeApiKey(workspace.id, key.id, user.id);

      // Verify Redis is invalidated
      const cachedVal = await redis.get(secureCacheKey);
      const mappedVal = await redis.get(idMappingKey);

      assert(
        "Revocation immediately deletes cache key from Redis",
        cachedVal === null
      );
      assert(
        "Revocation immediately deletes ID mapping from Redis",
        mappedVal === null
      );

      // Verify key fails authentication immediately
      const res = await verifyApiKey(rawKey);
      assert(
        "Revoked key fails authentication immediately",
        res === null
      );
    }

    // ----------------------------------------------------
    // Test Case 3: Expired Key Enforcement (DB layer)
    // ----------------------------------------------------
    {
      // Manually seed an expired key in DB
      const raw = `flw_expired${suffix}`;
      const prefix = raw.slice(0, 8);
      const keyHash = ApiKeyService.hashApiKey(raw);
      const expiredKey = await prisma.apiKey.create({
        data: {
          workspaceId: workspace.id,
          environmentId: defaultEnv.id,
          name: "Expired Key",
          keyHash,
          keyPrefix: prefix,
          scopes: ["read:entries"],
          expiresAt: new Date(Date.now() - 5000), // Expired 5 seconds ago
        },
      });

      const res = await verifyApiKey(raw);
      assert(
        "Expired key fails authentication (returns null)",
        res === null
      );

      // Verify it was not cached
      const hash = crypto.createHash("sha256").update(raw).digest("hex");
      const secureCacheKey = `auth:key:v1:${hash}`;
      const cachedVal = await redis.get(secureCacheKey);
      assert(
        "Expired key is not cached in Redis",
        cachedVal === null
      );
    }

    // ----------------------------------------------------
    // Test Case 4: Expired Key Enforcement (Cache layer)
    // ----------------------------------------------------
    {
      // Seed a key expiring in 2 seconds
      const raw = `flw_expiring${suffix}`;
      const prefix = raw.slice(0, 8);
      const keyHash = ApiKeyService.hashApiKey(raw);
      const key = await prisma.apiKey.create({
        data: {
          workspaceId: workspace.id,
          environmentId: defaultEnv.id,
          name: "Expiring Key",
          keyHash,
          keyPrefix: prefix,
          scopes: ["read:entries"],
          expiresAt: new Date(Date.now() + 2000), // Expires in 2 seconds
        },
      });

      // Verify once to populate cache
      const res1 = await verifyApiKey(raw);
      assert(
        "Expiring key is valid before expiry",
        res1 !== null && res1.valid === true
      );

      // Verify cache exists with dynamic TTL
      const hash = crypto.createHash("sha256").update(raw).digest("hex");
      const secureCacheKey = `auth:key:v1:${hash}`;
      const cachedVal = await redis.get(secureCacheKey);
      assert(
        "Expiring key is cached",
        cachedVal !== null
      );

      // Wait 3 seconds for expiration
      console.log("  Waiting 3s for key to expire...");
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verify again
      const res2 = await verifyApiKey(raw);
      assert(
        "Key fails verification after expiration",
        res2 === null
      );

      // Verify cache is deleted
      const cachedValAfter = await redis.get(secureCacheKey);
      assert(
        "Expired key cache is cleared on verification lookup",
        cachedValAfter === null
      );
    }

  } catch (err) {
    console.error("Error executing API Key Lifecycle Tests:", err);
    failed++;
  } finally {
    console.log("\nCleaning up seeded database records...");
    await prisma.workspace.delete({ where: { id: workspace.id } }).catch((e) => {
      console.error("Workspace cleanup failed:", e);
    });
    await prisma.user.delete({ where: { id: user.id } }).catch((e) => {
      console.error("User cleanup failed:", e);
    });
    console.log("Cleanup complete.");
  }

  console.log("\n==================================================");
  console.log(`   TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runApiKeyLifecycleTests().catch((err) => {
  console.error("Unhandled test runner error:", err);
  process.exit(1);
});
