import test from "node:test";
import assert from "node:assert";
import { prisma } from "../../src/lib/prisma";
import { checkStorageLimit } from "../../src/lib/usage";

// Save original prisma aggregate
const originalAggregate = prisma.media.aggregate;

// Helper to mock aggregate sum size
let mockSizeSum: number | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
prisma.media.aggregate = (async (args: any) => {
  if (args.where && args._sum && args._sum.size) {
    return {
      _sum: { size: mockSizeSum },
    };
  }
  return originalAggregate(args);
}) as any; // eslint-disable-next-line @typescript-eslint/no-explicit-any

test("Storage Limit Regression Tests", async (t) => {

  await t.test("Hobby Plan Rejection", async () => {
    // Hobby plan: limit 1 GB
    mockSizeSum = Math.round(0.9 * 1024 * 1024 * 1024);
    const uploadSize = 200 * 1024 * 1024;

    const result = await checkStorageLimit("workspace-id", "HOBBY", uploadSize, false);
    assert.strictEqual(result.allowed, false, "Should reject upload exceeding 1GB limit");
  });

  await t.test("Pro Plan Rejection", async () => {
    // Pro plan: limit 10 GB
    mockSizeSum = Math.round(9 * 1024 * 1024 * 1024);
    const uploadSize = 2 * 1024 * 1024 * 1024;

    const result = await checkStorageLimit("workspace-id", "PRO", uploadSize, false);
    assert.strictEqual(result.allowed, false, "Should reject upload exceeding 10GB limit");
  });

  await t.test("Agency Plan Rejection", async () => {
    // Agency plan: limit 50 GB
    mockSizeSum = Math.round(49 * 1024 * 1024 * 1024);
    const uploadSize = 2 * 1024 * 1024 * 1024;

    const result = await checkStorageLimit("workspace-id", "AGENCY", uploadSize, false);
    assert.strictEqual(result.allowed, false, "Should reject upload exceeding 50GB limit");
  });

  await t.test("Enterprise Plan Success", async () => {
    // Enterprise plan: unlimited limit (-1)
    mockSizeSum = Math.round(500 * 1024 * 1024 * 1024);
    const uploadSize = 50 * 1024 * 1024 * 1024;

    const result = await checkStorageLimit("workspace-id", "ENTERPRISE", uploadSize, false);
    assert.strictEqual(result.allowed, true, "Enterprise should allow unlimited storage");
  });

  await t.test("Under Limit Success", async () => {
    // Hobby plan: limit 1 GB
    mockSizeSum = Math.round(100 * 1024 * 1024);
    const uploadSize = 100 * 1024 * 1024;

    const result = await checkStorageLimit("workspace-id", "HOBBY", uploadSize, false);
    assert.strictEqual(result.allowed, true, "Should allow upload under the limit");
  });

  await t.test("Multi-File Upload Rejection", async () => {
    // Hobby plan: limit 1 GB
    mockSizeSum = Math.round(0.8 * 1024 * 1024 * 1024);
    const uploadSize = (100 + 200) * 1024 * 1024;

    const result = await checkStorageLimit("workspace-id", "HOBBY", uploadSize, false);
    assert.strictEqual(result.allowed, false, "Should reject multi-file upload exceeding limit");
  });

  // Restore prisma aggregate
  prisma.media.aggregate = originalAggregate;
});
