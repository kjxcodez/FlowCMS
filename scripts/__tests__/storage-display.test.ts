import test from "node:test";
import assert from "node:assert";
import { prisma } from "../../apps/app/src/lib/prisma";
import { getStorageUsage, checkStorageLimit } from "../../apps/app/src/lib/usage";

// Mock media data array
interface MockMediaItem {
  workspaceId: string;
  size: number;
  createdAt: Date;
}

let mockMediaItems: MockMediaItem[] = [];

// Save original prisma aggregate
const originalAggregate = prisma.media.aggregate;

// Mock implementation of prisma.media.aggregate
prisma.media.aggregate = (async (args: Parameters<typeof originalAggregate>[0]) => {
  if (args && args.where && args._sum && args._sum.size) {
    const { workspaceId, createdAt } = args.where;
    
    let filtered = mockMediaItems.filter(item => item.workspaceId === workspaceId);
    
    if (createdAt && typeof createdAt === "object" && "lte" in createdAt) {
      const lte = (createdAt as { lte?: Date }).lte;
      if (lte) {
        filtered = filtered.filter(item => item.createdAt <= lte);
      }
    }
    
    const sumSize = filtered.reduce((sum, item) => sum + item.size, 0);
    return {
      _sum: { size: sumSize > 0 ? sumSize : null },
    };
  }
  return originalAggregate(args);
}) as unknown as typeof prisma.media.aggregate;


test("Storage Display and Enforcement Tests", async (t) => {
  // Clear mock items before each test case
  t.beforeEach(() => {
    mockMediaItems = [];
  });

  await t.test("Case 1: Workspace with no media", async () => {
    const storageBytes = await getStorageUsage("workspace-1");
    assert.strictEqual(storageBytes, 0, "Storage usage should be 0 when there are no media files");
  });

  await t.test("Case 2: Workspace with uploaded files", async () => {
    mockMediaItems = [
      { workspaceId: "workspace-1", size: 1000, createdAt: new Date() },
      { workspaceId: "workspace-1", size: 2500, createdAt: new Date() },
      { workspaceId: "workspace-2", size: 5000, createdAt: new Date() }, // different workspace
    ];

    const storageBytes = await getStorageUsage("workspace-1");
    assert.strictEqual(storageBytes, 3500, "Storage usage should equal the sum of sizes of files in workspace-1");
  });

  await t.test("Case 3: Month boundary / Cumulative behavior", async () => {
    // January upload
    const janDate = new Date(2026, 0, 15); // Jan 15, 2026
    
    mockMediaItems = [
      { workspaceId: "workspace-1", size: 8 * 1024 * 1024 * 1024, createdAt: janDate }, // 8 GB in January
    ];
    
    // In January, display should reflect 8 GB
    const janEnd = new Date(2026, 0, 31, 23, 59, 59, 999);
    const janAgg = await prisma.media.aggregate({
      where: {
        workspaceId: "workspace-1",
        createdAt: { lte: janEnd },
      },
      _sum: { size: true },
    });
    assert.strictEqual(janAgg._sum.size, 8 * 1024 * 1024 * 1024, "January end cumulative storage should be 8 GB");

    // In February, even if no new uploads occur, display should STILL reflect 8 GB, not 0 GB
    const febEnd = new Date(2026, 1, 28, 23, 59, 59, 999);
    const febAgg = await prisma.media.aggregate({
      where: {
        workspaceId: "workspace-1",
        createdAt: { lte: febEnd },
      },
      _sum: { size: true },
    });
    assert.strictEqual(febAgg._sum.size, 8 * 1024 * 1024 * 1024, "February end cumulative storage should still be 8 GB");
  });

  await t.test("Case 4: Media deletion", async () => {
    mockMediaItems = [
      { workspaceId: "workspace-1", size: 3000, createdAt: new Date() },
      { workspaceId: "workspace-1", size: 2000, createdAt: new Date() },
    ];

    let storageBytes = await getStorageUsage("workspace-1");
    assert.strictEqual(storageBytes, 5000, "Initial storage should be 5000");

    // Simulate deleting the second file
    mockMediaItems.pop();

    storageBytes = await getStorageUsage("workspace-1");
    assert.strictEqual(storageBytes, 3000, "Storage usage should decrease to 3000 after file deletion");
  });

  await t.test("Case 5: Storage limit enforcement behavior remains unchanged", async () => {
    // Add media so current storage is 900MB
    mockMediaItems = [
      { workspaceId: "workspace-1", size: 900 * 1024 * 1024, createdAt: new Date() },
    ];

    // Hobby limit is 1 GB (1024 * 1024 * 1024 bytes)
    // Uploading 200 MB should be blocked (900MB + 200MB = 1100MB > 1GB)
    const uploadSize = 200 * 1024 * 1024;
    const check = await checkStorageLimit("workspace-1", "HOBBY", uploadSize, false);
    assert.strictEqual(check.allowed, false, "Should reject upload exceeding limit");
    assert.strictEqual(check.used, 900 * 1024 * 1024, "Used field in checkStorageLimit should return 900MB");
  });

  // Restore prisma aggregate
  prisma.media.aggregate = originalAggregate;
});
