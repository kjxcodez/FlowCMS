import test from "node:test";
import assert from "node:assert";
import { prisma } from "../../apps/app/src/lib/prisma";
import { auth } from "../../apps/app/src/lib/auth";
import { POST } from "../../apps/app/src/app/api/internal/api-explorer/run/route";
import { NextRequest } from "next/server";
import { ApiKey, User, WorkspaceMember, Collection, Environment, Entry, EntryStatus } from "../../apps/app/src/generated/prisma";

// Save original methods
const originalGetSession = auth.api.getSession;
const originalUserFindUnique = prisma.user.findUnique;
const originalMemberFindFirst = prisma.workspaceMember.findFirst;
const originalCollectionFindFirst = prisma.collection.findFirst;
const originalEnvFindFirst = prisma.environment.findFirst;
const originalEnvCreate = prisma.environment.create;
const originalApiKeyFindFirst = prisma.apiKey.findFirst;
const originalEntryFindMany = prisma.entry.findMany;

// Helper to define types for mock objects
interface MockSession {
  user: { id: string; email: string };
  session: { expiresAt: Date };
}

let mockSessionUser: { id: string; email: string } | null = { id: "user-id", email: "editor@example.com" };

// We cast the mock function to the original function type to satisfy TypeScript
auth.api.getSession = (async (): Promise<MockSession | null> => {
  if (mockSessionUser) {
    return {
      user: mockSessionUser,
      session: { expiresAt: new Date(Date.now() + 86400000) },
    };
  }
  return null;
}) as typeof auth.api.getSession;

prisma.user.findUnique = (async (): Promise<User | null> => {
  return {
    id: "user-id",
    email: "editor@example.com",
    name: "Editor User",
    emailVerified: true,
    onboarded: true,
    image: null,
    isSuspended: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}) as typeof prisma.user.findUnique;

prisma.workspaceMember.findFirst = (async (): Promise<(WorkspaceMember & { workspace: { id: string; name: string; slug: string; plan: "HOBBY" | "PRO" | "AGENCY" | "ENTERPRISE" } }) | null> => {
  return {
    id: "member-id",
    workspaceId: "ws-id",
    userId: "user-id",
    role: "EDITOR",
    createdAt: new Date(),
    workspace: {
      id: "ws-id",
      name: "Mock Workspace",
      slug: "mock-workspace",
      plan: "HOBBY",
    },
  };
}) as typeof prisma.workspaceMember.findFirst;

prisma.collection.findFirst = (async (): Promise<Collection | null> => {
  return {
    id: "col-id",
    workspaceId: "ws-id",
    name: "Mock Collection",
    slug: "mock-collection",
    description: null,
    mode: "STRUCTURED",
    fields: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}) as typeof prisma.collection.findFirst;

let mockEnvFindFirstResult: (() => Environment | null) | null = null;
prisma.environment.findFirst = (async (): Promise<Environment | null> => {
  if (mockEnvFindFirstResult) {
    return mockEnvFindFirstResult();
  }
  return null;
}) as typeof prisma.environment.findFirst;

prisma.environment.create = (async (args: any): Promise<Environment> => {
  return {
    id: "env-prod-slug-id",
    workspaceId: (args?.data?.workspaceId as string) || "ws-id",
    name: (args?.data?.name as string) || "Production",
    slug: (args?.data?.slug as string) || "production",
    isDefault: (args?.data?.isDefault as boolean) || false,
    createdAt: new Date(),
  };
}) as typeof prisma.environment.create;

let mockApiKeyFindFirstResult: (() => ApiKey | null) | null = null;
prisma.apiKey.findFirst = (async (): Promise<ApiKey | null> => {
  if (mockApiKeyFindFirstResult) {
    return mockApiKeyFindFirstResult();
  }
  return null;
}) as typeof prisma.apiKey.findFirst;

let lastQueryWhereClause: { collectionId?: string; environmentId?: string; status?: EntryStatus } | null = null;
prisma.entry.findMany = (async (args): Promise<Entry[]> => {
  if (args && args.where) {
    lastQueryWhereClause = args.where as { collectionId?: string; environmentId?: string; status?: EntryStatus };
  }
  return [
    {
      id: "entry-id",
      collectionId: "col-id",
      workspaceId: "ws-id",
      environmentId: "env-prod-id",
      slug: "published-entry",
      data: { title: "Published Title" },
      status: "PUBLISHED",
      version: 1,
      localeCode: "en",
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}) as typeof prisma.entry.findMany;

test("API Explorer Environment Scoping Tests", async (t) => {
  t.beforeEach(() => {
    mockSessionUser = { id: "user-id", email: "editor@example.com" };
    mockEnvFindFirstResult = null;
    mockApiKeyFindFirstResult = null;
    lastQueryWhereClause = null;
  });

  await t.test("Scoping with valid API key environment", async () => {
    mockApiKeyFindFirstResult = () => ({
      id: "key-id",
      workspaceId: "ws-id",
      environmentId: "env-prod-id",
      name: "Prod Key",
      keyHash: "hash",
      keyPrefix: "prefix",
      scopes: ["read:entries"],
      lastUsedAt: null,
      expiresAt: null,
      createdAt: new Date(),
    });

    const req = new NextRequest("http://localhost/api/internal/api-explorer/run", {
      method: "POST",
      body: JSON.stringify({
        collectionSlug: "mock-collection",
        apiKeyId: "key-id",
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    assert.ok(lastQueryWhereClause);
    assert.strictEqual(lastQueryWhereClause.environmentId, "env-prod-id");
  });

  await t.test("Scoping with API key without environment (unauthorized)", async () => {
    mockApiKeyFindFirstResult = () => ({
      id: "key-id",
      workspaceId: "ws-id",
      environmentId: null,
      name: "Legacy Key",
      keyHash: "hash",
      keyPrefix: "prefix",
      scopes: ["read:entries"],
      lastUsedAt: null,
      expiresAt: null,
      createdAt: new Date(),
    });

    const req = new NextRequest("http://localhost/api/internal/api-explorer/run", {
      method: "POST",
      body: JSON.stringify({
        collectionSlug: "mock-collection",
        apiKeyId: "key-id",
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 401);
    const body = await res.json() as { success: boolean; error: { code: string; message: string } };
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, "UNAUTHORIZED");
    assert.strictEqual(body.error.message, "API key is not bound to an environment.");
  });

  await t.test("Defaulting to workspace default environment (isDefault: true) when no key is chosen", async () => {
    mockEnvFindFirstResult = () => ({
      id: "env-default-id",
      workspaceId: "ws-id",
      name: "Production Default",
      slug: "production",
      isDefault: true,
      createdAt: new Date(),
    });

    const req = new NextRequest("http://localhost/api/internal/api-explorer/run", {
      method: "POST",
      body: JSON.stringify({
        collectionSlug: "mock-collection",
        apiKeyId: null,
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    assert.ok(lastQueryWhereClause);
    assert.strictEqual(lastQueryWhereClause.environmentId, "env-default-id");
  });

  await t.test("Defaulting fallback to production slug", async () => {
    let callCount = 0;
    mockEnvFindFirstResult = () => {
      callCount++;
      if (callCount === 1) return null; // Default check fails
      return {
        id: "env-prod-slug-id",
        workspaceId: "ws-id",
        name: "Production Fallback",
        slug: "production",
        isDefault: false,
        createdAt: new Date(),
      };
    };

    const req = new NextRequest("http://localhost/api/internal/api-explorer/run", {
      method: "POST",
      body: JSON.stringify({
        collectionSlug: "mock-collection",
        apiKeyId: null,
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    assert.ok(lastQueryWhereClause);
    assert.strictEqual(lastQueryWhereClause.environmentId, "env-prod-slug-id");
  });

  t.after(() => {
    // Restore originals
    auth.api.getSession = originalGetSession;
    prisma.user.findUnique = originalUserFindUnique;
    prisma.workspaceMember.findFirst = originalMemberFindFirst;
    prisma.collection.findFirst = originalCollectionFindFirst;
    prisma.environment.findFirst = originalEnvFindFirst;
    prisma.environment.create = originalEnvCreate;
    prisma.apiKey.findFirst = originalApiKeyFindFirst;
    prisma.entry.findMany = originalEntryFindMany;
  });
});
