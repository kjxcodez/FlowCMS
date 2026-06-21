import test from "node:test";
import assert from "node:assert";
import { prisma } from "../../src/lib/prisma";
import { WebhookService } from "../../src/server/services/webhook.service";

// Save originals
const originalCount = prisma.webhook.count;
const originalCreate = prisma.webhook.create;
const originalCreateAuditLog = prisma.auditLog.create;

let mockWebhookCount = 0;

prisma.webhook.count = (async () => {
  return mockWebhookCount;
}) as unknown as typeof prisma.webhook.count;

prisma.webhook.create = (async () => {
  return {
    id: "mock-webhook-id",
    workspaceId: "mock-workspace-id",
    url: "https://example.com/webhook",
    events: ["ENTRY_PUBLISHED"],
    secret: "mock-secret",
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as ReturnType<typeof originalCreate>;
}) as unknown as typeof prisma.webhook.create;

prisma.auditLog.create = (async () => {
  return { id: "mock-log-id" } as unknown as ReturnType<typeof originalCreateAuditLog>;
}) as unknown as typeof prisma.auditLog.create;

test("Webhook Limit Regression Tests", async (t) => {
  t.beforeEach(() => {
    mockWebhookCount = 0;
  });

  await t.test("Case 1: Hobby Plan Rejection (Feature unavailable)", async () => {
    // Hobby plan doesn't support webhooks at all
    await assert.rejects(
      async () => {
        await WebhookService.createWebhook(
          "ws-id",
          "https://example.com/webhook",
          ["ENTRY_PUBLISHED"],
          "user-id",
          "HOBBY",
          false
        );
      },
      (err: Error) => {
        return err.message.includes("FEATURE_NOT_AVAILABLE") && err.message.includes("Webhooks are not available on your current plan.");
      },
      "Should reject when Hobby plan attempts to create webhook"
    );
  });

  await t.test("Case 2: Pro workspace below limit succeeds", async () => {
    mockWebhookCount = 5; // Limit is 10
    const res = await WebhookService.createWebhook(
      "ws-id",
      "https://example.com/webhook",
      ["ENTRY_PUBLISHED"],
      "user-id",
      "PRO",
      false
    );
    assert.ok(res.id, "Should allow creating webhook on Pro plan when below limit");
  });

  await t.test("Case 3: Pro workspace at limit rejected", async () => {
    mockWebhookCount = 10; // Limit is 10
    await assert.rejects(
      async () => {
        await WebhookService.createWebhook(
          "ws-id",
          "https://example.com/webhook",
          ["ENTRY_PUBLISHED"],
          "user-id",
          "PRO",
          false
        );
      },
      (err: Error) => {
        return err.message.includes("LIMIT_EXCEEDED") && err.message.includes("Webhook limit reached for your plan.");
      },
      "Should reject when Pro plan is at count limit"
    );
  });

  await t.test("Case 4: Agency workspace below limit succeeds", async () => {
    mockWebhookCount = 40; // Limit is 50
    const res = await WebhookService.createWebhook(
      "ws-id",
      "https://example.com/webhook",
      ["ENTRY_PUBLISHED"],
      "user-id",
      "AGENCY",
      false
    );
    assert.ok(res.id, "Should allow creating webhook on Agency plan when below limit");
  });

  await t.test("Case 5: Agency workspace at limit rejected", async () => {
    mockWebhookCount = 50; // Limit is 50
    await assert.rejects(
      async () => {
        await WebhookService.createWebhook(
          "ws-id",
          "https://example.com/webhook",
          ["ENTRY_PUBLISHED"],
          "user-id",
          "AGENCY",
          false
        );
      },
      (err: Error) => {
        return err.message.includes("LIMIT_EXCEEDED") && err.message.includes("Webhook limit reached for your plan.");
      },
      "Should reject when Agency plan is at count limit"
    );
  });

  await t.test("Case 6: Enterprise workspace succeeds with no limit", async () => {
    mockWebhookCount = 10000; // Limit is unlimited (-1)
    const res = await WebhookService.createWebhook(
      "ws-id",
      "https://example.com/webhook",
      ["ENTRY_PUBLISHED"],
      "user-id",
      "ENTERPRISE",
      false
    );
    assert.ok(res.id, "Should allow creating webhook on Enterprise plan regardless of count");
  });

  await t.test("Case 7: AdminOverride bypasses Hobby feature restriction", async () => {
    const res = await WebhookService.createWebhook(
      "ws-id",
      "https://example.com/webhook",
      ["ENTRY_PUBLISHED"],
      "user-id",
      "HOBBY",
      true
    );
    assert.ok(res.id, "Admin should bypass Hobby plan feature restriction");
  });

  await t.test("Case 7: AdminOverride bypasses count limits", async () => {
    mockWebhookCount = 10; // Pro limit is 10
    const res = await WebhookService.createWebhook(
      "ws-id",
      "https://example.com/webhook",
      ["ENTRY_PUBLISHED"],
      "user-id",
      "PRO",
      true
    );
    assert.ok(res.id, "Admin should bypass Pro count limits");
  });
});

// Restore originals
test("Cleanup", async () => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  prisma.webhook.count = originalCount;
  prisma.webhook.create = originalCreate;
  prisma.auditLog.create = originalCreateAuditLog;
});

