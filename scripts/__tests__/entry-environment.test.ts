import test from "node:test";
import assert from "node:assert";
import { prisma } from "../../apps/app/src/lib/prisma";
import { auth } from "../../apps/app/src/lib/auth";
import { POST } from "../../apps/app/src/app/api/internal/entries/route";
import { NextRequest } from "next/server";

// Save original methods
const originalGetSession = auth.api.getSession;
const originalUserFindUnique = prisma.user.findUnique;
const originalMemberFindFirst = prisma.workspaceMember.findFirst;
const originalCollectionFindFirst = prisma.collection.findFirst;
const originalEnvFindFirst = prisma.environment.findFirst;
const originalEntryFindUnique = prisma.entry.findUnique;
const originalEntryCreate = prisma.entry.create;

// Mock setup
let mockSessionUser: any = { id: "user-id", email: "editor@example.com" };
auth.api.getSession = (async () => {
  return {
    user: mockSessionUser,
    session: { expiresAt: new Date(Date.now() + 86400000) },
  };
}) as any;

prisma.user.findUnique = (async (args: any) => {
  return { id: "user-id", onboarded: true, emailVerified: true };
}) as any;

prisma.workspaceMember.findFirst = (async (args: any) => {
  return {
    role: "EDITOR",
    workspace: {
      id: "ws-id",
      name: "Mock Workspace",
      slug: "mock-workspace",
      plan: "HOBBY",
    },
  };
}) as any;

prisma.collection.findFirst = (async (args: any) => {
  return {
    id: "col-id",
    name: "Mock Collection",
    slug: "mock-collection",
    workspaceId: "ws-id",
  };
}) as any;

// Helper to track passed create arguments
let lastCreatedEntryData: any = null;
prisma.entry.create = (async (args: any) => {
  lastCreatedEntryData = args.data;
  return {
    id: "entry-id",
    ...args.data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}) as any;

prisma.entry.findUnique = (async (args: any) => {
  // Return null so slug uniqueness check succeeds
  return null;
}) as any;

// State variables for env mock behavior
let mockEnvFindFirstResult: any = null;

prisma.environment.findFirst = (async (args: any) => {
  // Mock returns based on query arguments
  if (mockEnvFindFirstResult) {
    return mockEnvFindFirstResult(args);
  }
  return null;
}) as any;

test("Entry Environment Association Tests", async (t) => {
  t.beforeEach(() => {
    lastCreatedEntryData = null;
    mockEnvFindFirstResult = null;
  });

  await t.test("Default Environment Assignment (isDefault: true)", async () => {
    mockEnvFindFirstResult = (args: any) => {
      if (args.where.workspaceId === "ws-id" && args.where.isDefault === true) {
        return { id: "env-default-id", name: "Production", slug: "production", isDefault: true };
      }
      return null;
    };

    const req = new NextRequest("http://localhost/api/internal/entries", {
      method: "POST",
      body: JSON.stringify({
        collectionId: "col-id",
        slug: "test-entry",
        data: { title: "Test Title" },
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 200, "Should successfully create entry");
    assert.ok(lastCreatedEntryData, "Entry creation should have been captured");
    assert.strictEqual(lastCreatedEntryData.environmentId, "env-default-id", "Should default to the isDefault environment");
  });

  await t.test("Fallback to Production Slug Environment", async () => {
    mockEnvFindFirstResult = (args: any) => {
      // isDefault = true returns null, fallback slug: "production" returns the environment
      if (args.where.workspaceId === "ws-id" && args.where.slug === "production") {
        return { id: "env-prod-id", name: "Production", slug: "production", isDefault: false };
      }
      return null;
    };

    const req = new NextRequest("http://localhost/api/internal/entries", {
      method: "POST",
      body: JSON.stringify({
        collectionId: "col-id",
        slug: "test-entry-fallback",
        data: { title: "Test Title Fallback" },
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(lastCreatedEntryData.environmentId, "env-prod-id", "Should fallback to slug: production environment");
  });

  await t.test("Fallback to First Available Workspace Environment", async () => {
    mockEnvFindFirstResult = (args: any) => {
      // isDefault returns null, production slug returns null, first query returns first environment
      if (args.where.workspaceId === "ws-id" && Object.keys(args.where).length === 1) {
        return { id: "env-first-id", name: "Development", slug: "dev", isDefault: false };
      }
      return null;
    };

    const req = new NextRequest("http://localhost/api/internal/entries", {
      method: "POST",
      body: JSON.stringify({
        collectionId: "col-id",
        slug: "test-entry-first",
        data: { title: "Test Title First" },
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(lastCreatedEntryData.environmentId, "env-first-id", "Should fallback to first environment in the workspace");
  });

  await t.test("Explicit Environment Assignment", async () => {
    mockEnvFindFirstResult = (args: any) => {
      if (args.where.workspaceId === "ws-id" && args.where.id === "env-explicit-id") {
        return { id: "env-explicit-id", name: "Staging", slug: "staging", isDefault: false };
      }
      return null;
    };

    const req = new NextRequest("http://localhost/api/internal/entries", {
      method: "POST",
      body: JSON.stringify({
        collectionId: "col-id",
        environmentId: "env-explicit-id",
        slug: "test-entry-explicit",
        data: { title: "Test Title Explicit" },
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(lastCreatedEntryData.environmentId, "env-explicit-id", "Should assign explicit environmentId correctly");
  });

  await t.test("Cross-Workspace Environment ID Rejected", async () => {
    mockEnvFindFirstResult = (args: any) => {
      // Since it's cross-workspace, findFirst where workspaceId = "ws-id" and id = "cross-ws-env-id" will return null
      return null;
    };

    const req = new NextRequest("http://localhost/api/internal/entries", {
      method: "POST",
      body: JSON.stringify({
        collectionId: "col-id",
        environmentId: "cross-ws-env-id",
        slug: "test-entry-cross",
        data: { title: "Test Title Cross" },
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 404, "Should return 404 Not Found for cross-workspace environment");
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, "NOT_FOUND");
    assert.strictEqual(body.error.message, "Environment not found.");
  });

  t.after(() => {
    // Restore originals
    auth.api.getSession = originalGetSession;
    prisma.user.findUnique = originalUserFindUnique;
    prisma.workspaceMember.findFirst = originalMemberFindFirst;
    prisma.collection.findFirst = originalCollectionFindFirst;
    prisma.environment.findFirst = originalEnvFindFirst;
    prisma.entry.findUnique = originalEntryFindUnique;
    prisma.entry.create = originalEntryCreate;
  });
});
