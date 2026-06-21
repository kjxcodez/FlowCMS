import test from "node:test";
import assert from "node:assert";
import crypto from "crypto";

// 1. Mock Upstash Redis
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockRedisDb = new Map<string, any>();
class MockRedis {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async set(key: string, value: any, options?: any) {
    mockRedisDb.set(key, value);
    return "OK";
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async get(key: string): Promise<any> {
    return mockRedisDb.get(key) ?? null;
  }
  async del(...keys: string[]) {
    for (const k of keys) {
      mockRedisDb.delete(k);
    }
    return 1;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async incr(key: string) {
    const val = (mockRedisDb.get(key) || 0) + 1;
    mockRedisDb.set(key, val);
    return val;
  }
}
const resolvedRedisPath = require.resolve("@upstash/redis");
require.cache[resolvedRedisPath] = {
  id: resolvedRedisPath,
  filename: resolvedRedisPath,
  loaded: true,
  exports: { Redis: MockRedis },
} as any; // eslint-disable-line @typescript-eslint/no-explicit-any

// 2. Mock Upstash Ratelimit
const resolvedRatelimitPath = require.resolve("@upstash/ratelimit");
class MockRatelimit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(options: any) {}
  async limit(key: string) {
    return {
      success: true,
      limit: 100,
      remaining: 100,
      reset: Date.now() + 60000,
    };
  }
  static slidingWindow() {
    return {};
  }
}
require.cache[resolvedRatelimitPath] = {
  id: resolvedRatelimitPath,
  filename: resolvedRatelimitPath,
  loaded: true,
  exports: { Ratelimit: MockRatelimit },
} as any; // eslint-disable-line @typescript-eslint/no-explicit-any

// 3. Require the route and prisma using aliases
const { GET } = require("@/app/api/v1/entries/[collectionSlug]/[entrySlug]/route");
const { prisma } = require("@/lib/prisma");
const { NextRequest } = require("next/server");

// Save originals
const originalFindManyApiKey = prisma.apiKey.findMany;
const originalUpdateApiKey = prisma.apiKey.update;
const originalFindUniqueCollection = prisma.collection.findUnique;
const originalFindUniqueEntry = prisma.entry.findUnique;
const originalFindFirstEntry = prisma.entry.findFirst;
const originalFindUniqueDraftToken = prisma.draftToken.findUnique;
const originalFindUniqueMonthlyUsage = prisma.monthlyUsage.findUnique;
const originalUpsertMonthlyUsage = prisma.monthlyUsage.upsert;
const originalCreateUsageLog = prisma.usageLog.create;
const originalCreateAuditLog = prisma.auditLog.create;
const originalUpdateDraftToken = prisma.draftToken.update;

// Compute correct hash of mock key
const rawKey = "flw_mock_key";
const hash = crypto.createHash("sha256").update(rawKey).digest("hex");
const correctKeyHash = `sha256:${hash}`;

// Mock APIs
let mockApiKeys: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
let mockCollection: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
let mockEntry: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
let mockDraftToken: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
let capturedEntryWhere: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

prisma.apiKey.findMany = (async (args: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  return mockApiKeys;
}) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

prisma.apiKey.update = (async (args: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  return {};
}) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

prisma.collection.findUnique = (async (args: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  return mockCollection;
}) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

prisma.entry.findUnique = (async (args: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  capturedEntryWhere = args.where;
  return mockEntry;
}) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

prisma.entry.findFirst = (async (args: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  return mockEntry;
}) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

prisma.draftToken.findUnique = (async (args: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  return mockDraftToken;
}) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

prisma.draftToken.update = (async (args: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  return {};
}) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

prisma.monthlyUsage.findUnique = (async (args: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  return null;
}) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

prisma.monthlyUsage.upsert = (async (args: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  return {};
}) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

prisma.usageLog.create = (async (args: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  return {};
}) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

prisma.auditLog.create = (async (args: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  return {};
}) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

function buildGetRequest(headers: Record<string, string>, searchParams: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/v1/entries/blog-posts/hello-world");
  Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString(), {
    method: "GET",
    headers,
  });
}

test("API v1 Entry Resolution Environment-Scoped Uniqueness Tests", async (t) => {
  t.beforeEach(() => {
    mockRedisDb.clear();
    mockDraftToken = null;
    mockApiKeys = [
      {
        id: "key-id",
        workspaceId: "ws-id",
        environmentId: "env-prod-id",
        keyHash: correctKeyHash,
        keyPrefix: "flw_mock",
        scopes: ["read:entries"],
        workspace: { id: "ws-id", plan: "PRO" },
        expiresAt: null,
      },
    ];
    mockCollection = {
      id: "col-id",
      workspaceId: "ws-id",
      name: "Blog Posts",
      slug: "blog-posts",
    };
    mockEntry = {
      id: "entry-prod-id",
      collectionId: "col-id",
      workspaceId: "ws-id",
      environmentId: "env-prod-id",
      slug: "hello-world",
      status: "PUBLISHED",
      data: { title: "Production Post" },
    };
    capturedEntryWhere = null;
  });

  await t.test("Case 1: Production environment resolution", async () => {
    const req = buildGetRequest({
      Authorization: `Bearer ${rawKey}`,
    });

    const res = await GET(req, {
      params: Promise.resolve({
        collectionSlug: "blog-posts",
        entrySlug: "hello-world",
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.id, "entry-prod-id");
    assert.deepEqual(capturedEntryWhere, {
      collectionId_environmentId_slug: {
        collectionId: "col-id",
        environmentId: "env-prod-id",
        slug: "hello-world",
      },
    });
  });

  await t.test("Case 2: Staging environment resolution", async () => {
    mockApiKeys[0].environmentId = "env-staging-id";
    mockEntry = {
      id: "entry-staging-id",
      collectionId: "col-id",
      workspaceId: "ws-id",
      environmentId: "env-staging-id",
      slug: "hello-world",
      status: "PUBLISHED",
      data: { title: "Staging Post" },
    };

    const req = buildGetRequest({
      Authorization: `Bearer ${rawKey}`,
    });

    const res = await GET(req, {
      params: Promise.resolve({
        collectionSlug: "blog-posts",
        entrySlug: "hello-world",
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.id, "entry-staging-id");
    assert.deepEqual(capturedEntryWhere, {
      collectionId_environmentId_slug: {
        collectionId: "col-id",
        environmentId: "env-staging-id",
        slug: "hello-world",
      },
    });
  });

  await t.test("Case 3: Same slug exists in multiple environments", async () => {
    mockApiKeys[0].environmentId = "env-staging-id";
    mockEntry = {
      id: "entry-staging-id",
      collectionId: "col-id",
      workspaceId: "ws-id",
      environmentId: "env-staging-id",
      slug: "hello-world",
      status: "PUBLISHED",
      data: { title: "Staging Post" },
    };

    const req = buildGetRequest({
      Authorization: `Bearer ${rawKey}`,
    });

    const res = await GET(req, {
      params: Promise.resolve({
        collectionSlug: "blog-posts",
        entrySlug: "hello-world",
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.id, "entry-staging-id");
    assert.strictEqual(capturedEntryWhere.collectionId_environmentId_slug.environmentId, "env-staging-id");
  });

  await t.test("Case 4: Entry not found", async () => {
    mockEntry = null;

    const req = buildGetRequest({
      Authorization: `Bearer ${rawKey}`,
    });

    const res = await GET(req, {
      params: Promise.resolve({
        collectionSlug: "blog-posts",
        entrySlug: "non-existent",
      }),
    });

    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, "NOT_FOUND");
    assert.ok(body.error.message.includes("not found"));
  });

  await t.test("Case 5: Cross-environment lookup attempt", async () => {
    mockEntry = null;
    mockApiKeys[0].environmentId = "env-staging-id";

    const req = buildGetRequest({
      Authorization: `Bearer ${rawKey}`,
    });

    const res = await GET(req, {
      params: Promise.resolve({
        collectionSlug: "blog-posts",
        entrySlug: "hello-world",
      }),
    });

    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, "NOT_FOUND");
  });

  await t.test("Case 6: Preview functionality with valid draft entry", async () => {
    mockEntry = {
      id: "entry-draft-id",
      collectionId: "col-id",
      workspaceId: "ws-id",
      environmentId: "env-prod-id",
      slug: "hello-world",
      status: "DRAFT",
      data: { title: "Draft Post" },
    };

    mockDraftToken = {
      id: "token-id",
      token: "valid-draft-token",
      workspaceId: "ws-id",
      environmentId: "env-prod-id",
      active: true,
      expiresAt: new Date(Date.now() + 86400000),
      allowedCollectionId: null,
      allowedEntryId: null,
    };

    const req = buildGetRequest({
      Authorization: `Bearer ${rawKey}`,
    }, {
      preview: "true",
      token: "valid-draft-token",
    });

    const res = await GET(req, {
      params: Promise.resolve({
        collectionSlug: "blog-posts",
        entrySlug: "hello-world",
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.id, "entry-draft-id");
  });

  t.after(() => {
    prisma.apiKey.findMany = originalFindManyApiKey;
    prisma.apiKey.update = originalUpdateApiKey;
    prisma.collection.findUnique = originalFindUniqueCollection;
    prisma.entry.findUnique = originalFindUniqueEntry;
    prisma.entry.findFirst = originalFindFirstEntry;
    prisma.draftToken.findUnique = originalFindUniqueDraftToken;
    prisma.monthlyUsage.findUnique = originalFindUniqueMonthlyUsage;
    prisma.monthlyUsage.upsert = originalUpsertMonthlyUsage;
    prisma.usageLog.create = originalCreateUsageLog;
    prisma.auditLog.create = originalCreateAuditLog;
    prisma.draftToken.update = originalUpdateDraftToken;
    delete require.cache[resolvedRedisPath];
    delete require.cache[resolvedRatelimitPath];
  });
});
