import test from "node:test";
import assert from "node:assert";
import { prisma } from "../../src/lib/prisma";
import { WebhookService } from "../../src/server/services/webhook.service";

// Save originals
const originalCount = prisma.webhook.count;
const originalCreate = prisma.webhook.create;
const originalCreateAuditLog = prisma.auditLog.create;

let mockWebhookCount = 0;

prisma.webhook.count = (async (args: any) => {
  return mockWebhookCount;
}) as any;

prisma.webhook.create = (async (args: any) => {
  return {
    id: "mock-webhook-id",
    workspaceId: "mock-workspace-id",
    url: "https://example.com/webhook",
    events: ["ENTRY_PUBLISHED"],
    secret: "mock-secret",
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}) as any;

prisma.auditLog.create = (async (args: any) => {
  return { id: "mock-log-id" };
}) as any;

test("Webhook Limit Regression Tests", async (t) => {
  await t.test("Hobby Plan Rejection", async () => {
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
      (err: any) => {
        return err.message.includes("FEATURE_NOT_AVAILABLE") && err.message.includes("Webhooks are not available on your current plan.");
      },
      "Should reject when Hobby plan attempts to create webhook"
    );
  });

  await t.test("Pro Plan Success", async () => {
    const res = await WebhookService.createWebhook(
      "ws-id",
      "https://example.com/webhook",
      ["ENTRY_PUBLISHED"],
      "user-id",
      "PRO",
      false
    );
    assert.ok(res.id, "Should allow creating webhook on Pro plan");
  });

  await t.test("Agency Plan Success", async () => {
    const res = await WebhookService.createWebhook(
      "ws-id",
      "https://example.com/webhook",
      ["ENTRY_PUBLISHED"],
      "user-id",
      "AGENCY",
      false
    );
    assert.ok(res.id, "Should allow creating webhook on Agency plan");
  });

  await t.test("Enterprise Plan Success", async () => {
    const res = await WebhookService.createWebhook(
      "ws-id",
      "https://example.com/webhook",
      ["ENTRY_PUBLISHED"],
      "user-id",
      "ENTERPRISE",
      false
    );
    assert.ok(res.id, "Should allow creating webhook on Enterprise plan");
  });

  await t.test("Admin Override Success for Hobby Plan", async () => {
    const res = await WebhookService.createWebhook(
      "ws-id",
      "https://example.com/webhook",
      ["ENTRY_PUBLISHED"],
      "user-id",
      "HOBBY",
      true
    );
    assert.ok(res.id, "Admin should bypass Hobby limits");
  });

  // Restore originals
  prisma.webhook.count = originalCount;
  prisma.webhook.create = originalCreate;
  prisma.auditLog.create = originalCreateAuditLog;
});
