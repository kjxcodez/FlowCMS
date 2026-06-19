import test from "node:test";
import assert from "node:assert";
import { prisma } from "../../src/lib/prisma";
import { ApiKeyService } from "../../src/server/services/api-key.service";

// Save originals
const originalCount = prisma.apiKey.count;
const originalCreate = prisma.apiKey.create;
const originalFindUnique = prisma.workspace.findUnique;

let mockKeyCount = 0;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
prisma.apiKey.count = (async (args: any) => {
  return mockKeyCount;
}) as any; // eslint-disable-next-line @typescript-eslint/no-explicit-any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
prisma.apiKey.create = (async (args: any) => {
  return {
    id: "mock-key-id",
    keyPrefix: "mock-pref",
    name: "mock-key-name",
    createdAt: new Date(),
    scopes: ["read:entries"],
    environmentId: "mock-env-id",
  };
}) as any; // eslint-disable-next-line @typescript-eslint/no-explicit-any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
prisma.workspace.findUnique = (async (args: any) => {
  return { plan: "HOBBY" };
}) as any; // eslint-disable-next-line @typescript-eslint/no-explicit-any

test("API Key Limit Regression Tests", async (t) => {
  
  await t.test("Hobby Plan Rejection", async () => {
    // Hobby plan allows maximum of 2 API keys.
    mockKeyCount = 2;
    await assert.rejects(
      async () => {
        await ApiKeyService.createApiKey("ws-id", "Test key", "user-id", [], undefined, "HOBBY", false);
      },
      (err: any) => {
        return err.message.includes("PLAN_LIMIT_REACHED") && err.message.includes("maximum of 2 API keys");
      },
      "Should reject when Hobby plan limit of 2 API keys is reached"
    );
  });

  await t.test("Hobby Plan Success (Under Limit)", async () => {
    mockKeyCount = 1;
    const res = await ApiKeyService.createApiKey("ws-id", "Test key", "user-id", [], undefined, "HOBBY", false);
    assert.ok(res.key, "Should allow creating second key");
  });

  await t.test("Pro Plan Rejection", async () => {
    // Pro plan allows maximum of 10 API keys.
    mockKeyCount = 10;
    await assert.rejects(
      async () => {
        await ApiKeyService.createApiKey("ws-id", "Test key", "user-id", [], undefined, "PRO", false);
      },
      (err: any) => {
        return err.message.includes("PLAN_LIMIT_REACHED") && err.message.includes("maximum of 10 API keys");
      },
      "Should reject when Pro plan limit of 10 API keys is reached"
    );
  });

  await t.test("Agency Plan Rejection", async () => {
    // Agency plan allows maximum of 50 API keys.
    mockKeyCount = 50;
    await assert.rejects(
      async () => {
        await ApiKeyService.createApiKey("ws-id", "Test key", "user-id", [], undefined, "AGENCY", false);
      },
      (err: any) => {
        return err.message.includes("PLAN_LIMIT_REACHED") && err.message.includes("maximum of 50 API keys");
      },
      "Should reject when Agency plan limit of 50 API keys is reached"
    );
  });

  await t.test("Enterprise Plan Success", async () => {
    // Enterprise plan has unlimited API keys.
    mockKeyCount = 500;
    const res = await ApiKeyService.createApiKey("ws-id", "Test key", "user-id", [], undefined, "ENTERPRISE", false);
    assert.ok(res.key, "Enterprise should allow 501st key");
  });

  await t.test("Admin Override Success", async () => {
    // Admin override bypasses limits
    mockKeyCount = 5;
    const res = await ApiKeyService.createApiKey("ws-id", "Test key", "user-id", [], undefined, "HOBBY", true);
    assert.ok(res.key, "Admin should bypass limits");
  });

  // Restore originals
  prisma.apiKey.count = originalCount;
  prisma.apiKey.create = originalCreate;
  prisma.workspace.findUnique = originalFindUnique;
});
