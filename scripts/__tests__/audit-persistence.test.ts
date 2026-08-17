import test from "node:test";
import assert from "node:assert";
import { prisma } from "../../apps/app/src/lib/prisma";
import { logAction } from "../../apps/app/src/lib/audit";
import { Plan } from "../../apps/app/src/generated/prisma";

// Mock implementation helper
const originalCreate = prisma.auditLog.create;
const originalFindUnique = prisma.workspace.findUnique;

let dbPromiseResolve: (() => void) | null = null;
let dbPromiseReject: ((err: Error) => void) | null = null;
let dbPromisePending = false;

// Mock workspace database plan
let mockWorkspacePlan: Plan = Plan.HOBBY;

prisma.workspace.findUnique = (async (_args: Parameters<typeof originalFindUnique>[0]) => {
  if (_args && _args.where && "id" in _args.where && _args.where.id) {
    return { plan: mockWorkspacePlan } as unknown as ReturnType<typeof originalFindUnique>;
  }
  return originalFindUnique(_args);
}) as unknown as typeof prisma.workspace.findUnique;

prisma.auditLog.create = (async () => {
  dbPromisePending = true;
  return new Promise<ReturnType<typeof originalCreate>>((resolve, reject) => {
    dbPromiseResolve = () => {
      dbPromisePending = false;
      resolve({ id: "mock-log-id" } as unknown as ReturnType<typeof originalCreate>);
    };
    dbPromiseReject = (err) => {
      dbPromisePending = false;
      reject(err);
    };
  });
}) as unknown as typeof prisma.auditLog.create;

test("Audit Log Persistence Tier-Aware Tests", async (t) => {
  t.beforeEach(() => {
    dbPromiseResolve = null;
    dbPromiseReject = null;
    dbPromisePending = false;
    mockWorkspacePlan = Plan.HOBBY;
  });


  await t.test("Case 1: Hobby plan - fire and forget", async () => {
    mockWorkspacePlan = Plan.HOBBY;
    let logActionResolved = false;
    
    const p = logAction({
      workspaceId: "ws-hobby",
      action: "CREATE",
      resourceType: "ENTRY",
      resourceId: "entry-id",
    }).then(() => {
      logActionResolved = true;
    });

    // Wait a macro-task for fire-and-forget logAction to resolve
    await new Promise((resolve) => setTimeout(resolve, 10));

    assert.strictEqual(logActionResolved, true, "logAction should resolve immediately for Hobby");
    assert.strictEqual(dbPromisePending, true, "DB write should still be pending");
    
    // Resolve DB promise to clean up
    if (dbPromiseResolve) dbPromiseResolve();
    await p;
  });

  await t.test("Case 2: Pro plan - fire and forget", async () => {
    mockWorkspacePlan = Plan.PRO;
    let logActionResolved = false;
    
    const p = logAction({
      workspaceId: "ws-pro",
      action: "CREATE",
      resourceType: "ENTRY",
      resourceId: "entry-id",
    }).then(() => {
      logActionResolved = true;
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    assert.strictEqual(logActionResolved, true, "logAction should resolve immediately for Pro");
    assert.strictEqual(dbPromisePending, true, "DB write should still be pending");
    
    if (dbPromiseResolve) dbPromiseResolve();
    await p;
  });

  await t.test("Case 3: Agency plan - awaited", async () => {
    mockWorkspacePlan = Plan.AGENCY;
    let logActionResolved = false;
    
    const p = logAction({
      workspaceId: "ws-agency",
      action: "CREATE",
      resourceType: "ENTRY",
      resourceId: "entry-id",
    }).then(() => {
      logActionResolved = true;
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    // For Agency, logAction should NOT resolve while DB is pending
    assert.strictEqual(logActionResolved, false, "logAction should not resolve immediately for Agency");
    assert.strictEqual(dbPromisePending, true, "DB write should still be pending");
    
    // Now resolve the DB promise
    if (dbPromiseResolve) dbPromiseResolve();
    
    await p;
    assert.strictEqual(logActionResolved, true, "logAction should resolve once DB write succeeds");
  });

  await t.test("Case 4: Enterprise plan - awaited", async () => {
    mockWorkspacePlan = Plan.ENTERPRISE;
    let logActionResolved = false;
    
    const p = logAction({
      workspaceId: "ws-enterprise",
      action: "CREATE",
      resourceType: "ENTRY",
      resourceId: "entry-id",
    }).then(() => {
      logActionResolved = true;
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    assert.strictEqual(logActionResolved, false, "logAction should not resolve immediately for Enterprise");
    assert.strictEqual(dbPromisePending, true, "DB write should still be pending");
    
    if (dbPromiseResolve) dbPromiseResolve();
    
    await p;
    assert.strictEqual(logActionResolved, true, "logAction should resolve once DB write succeeds");
  });

  await t.test("Case 5: Agency audit log write failure", async () => {
    mockWorkspacePlan = Plan.AGENCY;
    
    const p = logAction({
      workspaceId: "ws-agency-fail",
      action: "CREATE",
      resourceType: "ENTRY",
      resourceId: "entry-id",
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    
    // Reject the db write
    if (dbPromiseReject) dbPromiseReject(new Error("DB Write Failed"));

    await assert.rejects(p, /DB Write Failed/, "Agency should propagate log creation failure");
  });

  await t.test("Case 6: Enterprise audit log write failure", async () => {
    mockWorkspacePlan = Plan.ENTERPRISE;
    
    const p = logAction({
      workspaceId: "ws-enterprise-fail",
      action: "CREATE",
      resourceType: "ENTRY",
      resourceId: "entry-id",
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    
    if (dbPromiseReject) dbPromiseReject(new Error("DB Write Failed"));

    await assert.rejects(p, /DB Write Failed/, "Enterprise should propagate log creation failure");
  });

  await t.test("Case 7: Hobby audit log write failure", async () => {
    mockWorkspacePlan = Plan.HOBBY;
    
    const p = logAction({
      workspaceId: "ws-hobby-fail",
      action: "CREATE",
      resourceType: "ENTRY",
      resourceId: "entry-id",
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    
    // Reject the db write
    if (dbPromiseReject) dbPromiseReject(new Error("DB Write Failed"));

    // Hobby should resolve without throwing even if DB write rejected
    await p;
    assert.ok(true, "Hobby should not throw on DB write rejection");
  });

  await t.test("Case 8: Pro audit log write failure", async () => {
    mockWorkspacePlan = Plan.PRO;
    
    const p = logAction({
      workspaceId: "ws-pro-fail",
      action: "CREATE",
      resourceType: "ENTRY",
      resourceId: "entry-id",
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    
    if (dbPromiseReject) dbPromiseReject(new Error("DB Write Failed"));

    await p;
    assert.ok(true, "Pro should not throw on DB write rejection");
  });
});

// Restore original implementations
test("Cleanup", () => {
  prisma.workspace.findUnique = originalFindUnique;
  prisma.auditLog.create = originalCreate;
});
