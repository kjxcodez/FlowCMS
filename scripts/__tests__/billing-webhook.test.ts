import test from "node:test";
import assert from "node:assert";
import { POST } from "../../src/app/api/billing/webhook/route";
import { NextRequest } from "next/server";
import { prisma } from "../../src/lib/prisma";
import { Redis } from "@upstash/redis";

// Mock razorpay signature validation
// eslint-disable-next-line @typescript-eslint/no-var-requires
const razorpayUtils = require("razorpay/dist/utils/razorpay-utils");
const originalValidate = razorpayUtils.validateWebhookSignature;
razorpayUtils.validateWebhookSignature = () => true;

// Mock Upstash Redis
const originalSet = Redis.prototype.set;
const originalDel = Redis.prototype.del;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockRedisDb = new Map<string, any>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
Redis.prototype.set = (async (key: string, value: any, options?: any) => {
  if (options?.nx && mockRedisDb.has(key)) {
    return null;
  }
  mockRedisDb.set(key, value);
  return "OK";
}) as any; // eslint-disable-next-line @typescript-eslint/no-explicit-any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
Redis.prototype.del = (async (...keys: string[]) => {
  for (const k of keys) {
    mockRedisDb.delete(k);
  }
  return 1;
}) as any; // eslint-disable-next-line @typescript-eslint/no-explicit-any

// Mock Prisma
const originalTransaction = prisma.$transaction;
const originalFindUniqueCustomer = prisma.razorpayCustomer.findUnique;
const originalUpdateCustomer = prisma.razorpayCustomer.update;
const originalUpdateWorkspace = prisma.workspace.update;
const originalFindManyApiKey = prisma.apiKey.findMany;
const originalCreateAuditLog = prisma.auditLog.create;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockCustomer: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockWorkspace: any = null;
let updatedWorkspacePlan: string | null = null;
let updatedCustomerStatus: string | null = null;
let transactionExecuted = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
prisma.$transaction = (async (cb: any) => {
  transactionExecuted = true;
  return await cb(prisma);
}) as any; // eslint-disable-next-line @typescript-eslint/no-explicit-any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
prisma.razorpayCustomer.findUnique = (async (args: any) => {
  return mockCustomer;
}) as any; // eslint-disable-next-line @typescript-eslint/no-explicit-any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
prisma.razorpayCustomer.update = (async (args: any) => {
  if (args.data?.subscriptionStatus) {
    updatedCustomerStatus = args.data.subscriptionStatus;
  }
  return { ...mockCustomer, ...args.data };
}) as any; // eslint-disable-next-line @typescript-eslint/no-explicit-any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
prisma.workspace.update = (async (args: any) => {
  if (args.data?.plan) {
    updatedWorkspacePlan = args.data.plan;
  }
  return { ...mockWorkspace, ...args.data };
}) as any; // eslint-disable-next-line @typescript-eslint/no-explicit-any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
prisma.apiKey.findMany = (async (args: any) => {
  return [];
}) as any; // eslint-disable-next-line @typescript-eslint/no-explicit-any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
prisma.auditLog.create = (async (args: any) => {
  return {};
}) as any; // eslint-disable-next-line @typescript-eslint/no-explicit-any

// Helper to build mock webhook request
function buildWebhookRequest(eventId: string, eventName: string, subId: string, planId: string, timestamp: number) {
  return new NextRequest("http://localhost/api/billing/webhook", {
    method: "POST",
    headers: {
      "x-razorpay-signature": "mock-sig",
    },
    body: JSON.stringify({
      id: eventId,
      event: eventName,
      created_at: timestamp,
      payload: {
        subscription: {
          entity: {
            id: subId,
            plan_id: planId,
            current_end: timestamp + 30 * 86400,
            notes: {
              workspaceId: "ws-123",
            },
          },
        },
      },
    }),
  });
}

test("Billing Webhook Route Handler Tests", async (t) => {

  t.beforeEach(() => {
    mockRedisDb.clear();
    mockCustomer = {
      subscriptionId: "sub-123",
      subscriptionStatus: "active",
      lastEventAt: new Date(Date.now() - 100000),
    };
    mockWorkspace = {
      id: "ws-123",
      plan: "HOBBY",
    };
    updatedWorkspacePlan = null;
    updatedCustomerStatus = null;
    transactionExecuted = false;
  });

  await t.test("Plan Upgrade (Hobby -> Pro)", async () => {
    const req = buildWebhookRequest("evt_upg_1", "subscription.charged", "sub-123", "plan_pro", Math.floor(Date.now() / 1000));
    const res = await POST(req);

    assert.strictEqual(res.status, 200, "Webhook should process successfully");
    assert.strictEqual(updatedWorkspacePlan, "PRO", "Plan should upgrade to PRO");
    assert.strictEqual(updatedCustomerStatus, "active", "Customer status should be active");
  });

  await t.test("Plan Downgrade (Agency -> Pro)", async () => {
    mockWorkspace.plan = "AGENCY";

    const req = buildWebhookRequest("evt_dwn_1", "subscription.charged", "sub-123", "plan_pro", Math.floor(Date.now() / 1000));
    const res = await POST(req);

    assert.strictEqual(res.status, 200, "Webhook should process successfully");
    assert.strictEqual(updatedWorkspacePlan, "PRO", "Plan should downgrade to PRO");
  });

  await t.test("Replay Protection (Idempotency)", async () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const req1 = buildWebhookRequest("evt_dup_1", "subscription.charged", "sub-123", "plan_pro", timestamp);
    const res1 = await POST(req1);
    assert.strictEqual(res1.status, 200, "First webhook should process successfully");
    assert.strictEqual(transactionExecuted, true);

    transactionExecuted = false;

    // Send same event ID again
    const req2 = buildWebhookRequest("evt_dup_1", "subscription.charged", "sub-123", "plan_pro", timestamp);
    const res2 = await POST(req2);
    assert.strictEqual(res2.status, 200, "Second webhook should return 200 OK");

    const bodyText = await res2.text();
    assert.ok(bodyText.includes("Duplicate"), "Should return duplicate message");
    assert.strictEqual(transactionExecuted, false, "Should not execute transaction again for duplicate event");
  });

  await t.test("Out-of-order Events Ignored", async () => {
    // Current database event date is set to now
    mockCustomer.lastEventAt = new Date();

    // Send an event with timestamp 10 seconds in the past
    const oldTimestamp = Math.floor(Date.now() / 1000) - 10;
    const req = buildWebhookRequest("evt_old_1", "subscription.charged", "sub-123", "plan_pro", oldTimestamp);

    const res = await POST(req);
    assert.strictEqual(res.status, 200, "Old event should return 200 OK");

    const bodyText = await res.text();
    assert.ok(bodyText.includes("Out of order"), "Should return out of order message");
    assert.strictEqual(transactionExecuted, false, "Should not update database for out-of-order event");
  });

  t.after(() => {
    // Restore stubs
    razorpayUtils.validateWebhookSignature = originalValidate;
    Redis.prototype.set = originalSet;
    Redis.prototype.del = originalDel;
    prisma.$transaction = originalTransaction;
    prisma.razorpayCustomer.findUnique = originalFindUniqueCustomer;
    prisma.razorpayCustomer.update = originalUpdateCustomer;
    prisma.workspace.update = originalUpdateWorkspace;
    prisma.apiKey.findMany = originalFindManyApiKey;
    prisma.auditLog.create = originalCreateAuditLog;
  });
});
