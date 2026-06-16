import { prisma } from "../lib/prisma";
import { ApiKeyService } from "../server/services/api-key.service";
import { GET as getEntries } from "../app/api/v1/entries/[collectionSlug]/route";
import { GET as getEntry } from "../app/api/v1/entries/[collectionSlug]/[entrySlug]/route";
import { GET as getMedia } from "../app/api/v1/media/route";
import { GET as getWorkspace } from "../app/api/v1/workspace/route";
import { withApiAuth, requireScope } from "../middleware/with-api-auth";
import { apiSuccess } from "../types/api";
import { NextRequest } from "next/server";

async function runApiKeyTests() {
  console.log("==================================================");
  console.log("   RUNNING FLOWCMS API KEY SCOPE INTEGRATION TESTS");
  console.log("==================================================");

  const suffix = Math.random().toString(36).substring(7);

  // 1. Seed Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: `Scope Test WS ${suffix}`,
      slug: `scope-test-ws-${suffix}`,
    },
  });

  // Seed a test collection
  const collection = await prisma.collection.create({
    data: {
      workspaceId: workspace.id,
      name: `Scope Test Col ${suffix}`,
      slug: `scope-test-col-${suffix}`,
      fields: [],
    },
  });

  // Seed a test entry
  const entry = await prisma.entry.create({
    data: {
      collectionId: collection.id,
      workspaceId: workspace.id,
      slug: `scope-test-entry-${suffix}`,
      data: { title: "Test entry" },
      status: "PUBLISHED",
    },
  });

  // 2. Seed API Keys with different scopes
  const user = await prisma.user.create({
    data: {
      email: `scope-tester-${suffix}@example.com`,
      name: "Scope Tester",
      emailVerified: true,
      onboarded: true,
    },
  });

  async function generateTestKey(name: string, scopes: string[]) {
    const { raw, prefix } = ApiKeyService.generateApiKey();
    const keyHash = ApiKeyService.hashApiKey(raw);
    const key = await prisma.apiKey.create({
      data: {
        workspaceId: workspace.id,
        name,
        keyHash,
        keyPrefix: prefix,
        scopes,
      },
    });
    return { raw, key };
  }

  const keyReadEntries = await generateTestKey("Read Entries Key", ["read:entries"]);
  const keyWriteEntries = await generateTestKey("Write Entries Key", ["write:entries"]);
  const keyMultiple = await generateTestKey("Multiple Scopes Key", ["read:entries", "read:collections"]);
  const keyAdmin = await generateTestKey("Admin Key", ["admin:workspace"]);
  const keyNoScopes = await generateTestKey("No Scopes Key", []);

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, message?: string) {
    if (condition) {
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${name}${message ? ` - ${message}` : ""}`);
      failed++;
    }
  }

  function createReq(url: string, method: string, rawKey: string, body?: any) {
    return new NextRequest(url, {
      method,
      headers: {
        Authorization: `Bearer ${rawKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  try {
    // Test Case 1: Valid Scope (GET entries with read:entries scope)
    {
      const req = createReq(
        `http://localhost:3000/api/v1/entries/${collection.slug}`,
        "GET",
        keyReadEntries.raw
      );
      const res = await getEntries(req, { params: Promise.resolve({ collectionSlug: collection.slug }) });
      assert(
        "GET entries with read:entries scope is allowed",
        res.status === 200,
        `Status: ${res.status}`
      );
    }

    // Test Case 2: Invalid Scope (GET entries with write:entries scope only)
    {
      const req = createReq(
        `http://localhost:3000/api/v1/entries/${collection.slug}`,
        "GET",
        keyWriteEntries.raw
      );
      const res = await getEntries(req, { params: Promise.resolve({ collectionSlug: collection.slug }) });
      assert(
        "GET entries with only write:entries scope is blocked (403)",
        res.status === 403,
        `Status: ${res.status}`
      );
      const json = await res.json();
      assert(
        "GET entries blocked response payload is structured correctly",
        json.success === false && json.error?.code === "FORBIDDEN",
        JSON.stringify(json)
      );
    }

    // Test Case 3: Multiple Scopes (Endpoint requiring BOTH read:entries AND read:collections)
    {
      const doubleScopeHandler = withApiAuth(
        requireScope(["read:entries", "read:collections"], async (req, ctx) => {
          return apiSuccess({ success: true });
        })
      );

      const req1 = createReq("http://localhost:3000/api/test-multi", "GET", keyMultiple.raw);
      const res1 = await doubleScopeHandler(req1);
      assert(
        "Handler requiring multiple scopes allows key with all scopes",
        res1.status === 200,
        `Status: ${res1.status}`
      );

      const req2 = createReq("http://localhost:3000/api/test-multi", "GET", keyReadEntries.raw);
      const res2 = await doubleScopeHandler(req2);
      assert(
        "Handler requiring multiple scopes blocks key missing one scope (403)",
        res2.status === 403,
        `Status: ${res2.status}`
      );
    }

    // Test Case 4: Missing/Empty Scopes
    {
      const req = createReq(
        `http://localhost:3000/api/v1/entries/${collection.slug}`,
        "GET",
        keyNoScopes.raw
      );
      const res = await getEntries(req, { params: Promise.resolve({ collectionSlug: collection.slug }) });
      assert(
        "Key with empty scopes is blocked from GET entries",
        res.status === 403,
        `Status: ${res.status}`
      );
    }

    // Test Case 5: Admin super-scope wildcard bypass
    {
      const reqGet = createReq(
        `http://localhost:3000/api/v1/entries/${collection.slug}`,
        "GET",
        keyAdmin.raw
      );
      const resGet = await getEntries(reqGet, { params: Promise.resolve({ collectionSlug: collection.slug }) });
      assert(
        "admin:workspace key bypasses read:entries restriction",
        resGet.status === 200,
        `Status: ${resGet.status}`
      );

      const reqWS = createReq(`http://localhost:3000/api/v1/workspace`, "GET", keyAdmin.raw);
      const resWS = await getWorkspace(reqWS, { params: Promise.resolve({}) });
      assert(
        "admin:workspace key successfully accesses admin-only workspace route",
        resWS.status === 200,
        `Status: ${resWS.status}`
      );

      const reqWSBlocked = createReq(`http://localhost:3000/api/v1/workspace`, "GET", keyReadEntries.raw);
      const resWSBlocked = await getWorkspace(reqWSBlocked, { params: Promise.resolve({}) });
      assert(
        "read:entries key is blocked from admin-only workspace route",
        resWSBlocked.status === 403,
        `Status: ${resWSBlocked.status}`
      );
    }

    // Test Case 6: Invalid API Key authentication (401 Unauthorized)
    {
      const req = createReq(
        `http://localhost:3000/api/v1/entries/${collection.slug}`,
        "GET",
        "flw_invalidkeyhere123456789012345678"
      );
      const res = await getEntries(req, { params: Promise.resolve({ collectionSlug: collection.slug }) });
      assert(
        "Invalid API Key is unauthorized (401)",
        res.status === 401,
        `Status: ${res.status}`
      );
    }

  } catch (err) {
    console.error("Error running API key scope tests:", err);
    failed++;
  } finally {
    console.log("\nCleaning up seeded database records...");
    await prisma.workspace.delete({ where: { id: workspace.id } }).catch((e) => {
      console.error("Workspace cleanup failed:", e);
    });
    await prisma.user.delete({ where: { id: user.id } }).catch((e) => {
      console.error("User cleanup failed:", e);
    });
    console.log("Cleanup complete.");
  }

  console.log("\n==================================================");
  console.log(`   TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runApiKeyTests().catch((err) => {
  console.error("Unhandled test runner error:", err);
  process.exit(1);
});
