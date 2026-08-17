import { prisma } from "../apps/app/src/lib/prisma";
import { ApiKeyService } from "../apps/app/src/server/services/api-key.service";
import { GET as getEntries } from "../apps/app/src/app/api/v1/entries/[collectionSlug]/route";
import { GET as getEntry } from "../apps/app/src/app/api/v1/entries/[collectionSlug]/[entrySlug]/route";
import { verifyDraftPreview } from "../apps/app/src/lib/preview";
import { dispatchWebhooks } from "../apps/app/src/lib/webhooks";
import { NextRequest } from "next/server";

// Simple mock for qstash.publishJSON to intercept and track webhook calls in tests
let dispatchedWebhooksList: Array<{ webhookId: string; event: string }> = [];
mockQStashPublish();

function mockQStashPublish() {
  const { qstash } = require("../lib/qstash");
  qstash.publishJSON = async (params: any) => {
    const webhookId = params.headers?.["X-Flow-Webhook-Id"];
    const event = params.body?.event;
    dispatchedWebhooksList.push({ webhookId, event });
    return { messageId: "mock-msg-123" };
  };
}

async function runEnvironmentIsolationTests() {
  console.log("==================================================");
  console.log(" RUNNING FLOWCMS ENVIRONMENT ISOLATION INTEGRATION TESTS");
  console.log("==================================================");

  const suffix = Math.random().toString(36).substring(7);

  // 1. Seed Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: `Isolation Test WS ${suffix}`,
      slug: `isolation-test-ws-${suffix}`,
    },
  });

  // Seed two Environments
  const envProd = await prisma.environment.create({
    data: {
      workspaceId: workspace.id,
      name: "Production",
      slug: "production",
      isDefault: true,
    },
  });

  const envStaging = await prisma.environment.create({
    data: {
      workspaceId: workspace.id,
      name: "Staging",
      slug: "staging",
      isDefault: false,
    },
  });

  // Seed a Collection
  const collection = await prisma.collection.create({
    data: {
      workspaceId: workspace.id,
      name: `Blog Posts ${suffix}`,
      slug: `blog-${suffix}`,
      fields: [
        { slug: "title", type: "text" },
        { slug: "featured_entry", type: "reference" }
      ] as any,
    },
  });

  // Seed Entries:
  // Prod Entry (published)
  const entryProd = await prisma.entry.create({
    data: {
      collectionId: collection.id,
      workspaceId: workspace.id,
      environmentId: envProd.id,
      slug: `prod-entry-${suffix}`,
      data: { title: "Production Post", featured_entry: null },
      status: "PUBLISHED",
    },
  });

  // Staging Entry (published)
  const entryStaging = await prisma.entry.create({
    data: {
      collectionId: collection.id,
      workspaceId: workspace.id,
      environmentId: envStaging.id,
      slug: `staging-entry-${suffix}`,
      data: { title: "Staging Post", featured_entry: null },
      status: "PUBLISHED",
    },
  });

  // Cross-environment reference entry: A production entry referencing a staging entry
  const crossRefEntryProd = await prisma.entry.create({
    data: {
      collectionId: collection.id,
      workspaceId: workspace.id,
      environmentId: envProd.id,
      slug: `cross-ref-prod-${suffix}`,
      data: { title: "Cross-referenced Prod Post", featured_entry: entryStaging.id },
      status: "PUBLISHED",
    },
  });

  // 2. Seed API Keys
  async function generateTestKey(name: string, environmentId: string) {
    const { raw, prefix } = ApiKeyService.generateApiKey();
    const keyHash = ApiKeyService.hashApiKey(raw);
    const key = await prisma.apiKey.create({
      data: {
        workspaceId: workspace.id,
        environmentId,
        name,
        keyHash,
        keyPrefix: prefix,
        scopes: ["read:entries"],
      },
    });
    return { raw, key };
  }

  const prodKey = await generateTestKey("Production Key", envProd.id);
  const stagingKey = await generateTestKey("Staging Key", envStaging.id);

  // 3. Seed Webhooks
  const webhookGlobal = await prisma.webhook.create({
    data: {
      workspaceId: workspace.id,
      url: "https://example.com/global",
      events: ["ENTRY_PUBLISHED"],
      secret: "secret-global",
      enabled: true,
    },
  });

  const webhookProd = await prisma.webhook.create({
    data: {
      workspaceId: workspace.id,
      environmentId: envProd.id,
      url: "https://example.com/prod",
      events: ["ENTRY_PUBLISHED"],
      secret: "secret-prod",
      enabled: true,
    },
  });

  const webhookStaging = await prisma.webhook.create({
    data: {
      workspaceId: workspace.id,
      environmentId: envStaging.id,
      url: "https://example.com/staging",
      events: ["ENTRY_PUBLISHED"],
      secret: "secret-staging",
      enabled: true,
    },
  });

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

  function createReq(url: string, method: string, rawKey: string) {
    return new NextRequest(url, {
      method,
      headers: {
        Authorization: `Bearer ${rawKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  try {
    // Test Case 1: Entries List Scoping Isolation
    {
      // Production Key Request
      const reqProd = createReq(`http://localhost:3000/api/v1/entries/${collection.slug}`, "GET", prodKey.raw);
      const resProd = await getEntries(reqProd, { params: Promise.resolve({ collectionSlug: collection.slug }) });
      assert("Production key request returns 200", resProd.status === 200, `Status: ${resProd.status}`);
      const jsonProd = await resProd.json();
      assert("Production key lists entries", jsonProd.success === true, JSON.stringify(jsonProd));
      const hasProdEntry = jsonProd.data.some((e: any) => e.id === entryProd.id);
      const hasStagingEntry = jsonProd.data.some((e: any) => e.id === entryStaging.id);
      assert("Production key reads production entry", hasProdEntry);
      assert("Production key cannot read staging entry", !hasStagingEntry);

      // Staging Key Request
      const reqStaging = createReq(`http://localhost:3000/api/v1/entries/${collection.slug}`, "GET", stagingKey.raw);
      const resStaging = await getEntries(reqStaging, { params: Promise.resolve({ collectionSlug: collection.slug }) });
      assert("Staging key request returns 200", resStaging.status === 200, `Status: ${resStaging.status}`);
      const jsonStaging = await resStaging.json();
      const hasProdEntryStg = jsonStaging.data.some((e: any) => e.id === entryProd.id);
      const hasStagingEntryStg = jsonStaging.data.some((e: any) => e.id === entryStaging.id);
      assert("Staging key reads staging entry", hasStagingEntryStg);
      assert("Staging key cannot read production entry", !hasProdEntryStg);
    }

    // Test Case 2: Slug-based GET entry Scoping Isolation (404 for mismatched env)
    {
      // Try reading Staging entry with Production Key
      const reqProd = createReq(`http://localhost:3000/api/v1/entries/${collection.slug}/${entryStaging.slug}`, "GET", prodKey.raw);
      const resProd = await getEntry(reqProd, { params: Promise.resolve({ collectionSlug: collection.slug, entrySlug: entryStaging.slug }) });
      assert("Production key gets 404 for Staging entry slug", resProd.status === 404, `Status: ${resProd.status}`);

      // Try reading Production entry with Staging Key
      const reqStaging = createReq(`http://localhost:3000/api/v1/entries/${collection.slug}/${entryProd.slug}`, "GET", stagingKey.raw);
      const resStaging = await getEntry(reqStaging, { params: Promise.resolve({ collectionSlug: collection.slug, entrySlug: entryProd.slug }) });
      assert("Staging key gets 404 for Production entry slug", resStaging.status === 404, `Status: ${resStaging.status}`);

      // Successful matching environment reads
      const reqProdOk = createReq(`http://localhost:3000/api/v1/entries/${collection.slug}/${entryProd.slug}`, "GET", prodKey.raw);
      const resProdOk = await getEntry(reqProdOk, { params: Promise.resolve({ collectionSlug: collection.slug, entrySlug: entryProd.slug }) });
      assert("Production key reads Production entry slug successfully (200)", resProdOk.status === 200, `Status: ${resProdOk.status}`);
    }

    // Test Case 3: Relation Expansion Scoping Isolation
    {
      // Production Key attempts to expand relation containing a reference to a Staging entry
      const reqProd = createReq(`http://localhost:3000/api/v1/entries/${collection.slug}?expand=true`, "GET", prodKey.raw);
      const resProd = await getEntries(reqProd, { params: Promise.resolve({ collectionSlug: collection.slug }) });
      assert("Expand query returns 200", resProd.status === 200, `Status: ${resProd.status}`);
      const jsonProd = await resProd.json();
      
      const crossRefEntry = jsonProd.data.find((e: any) => e.id === crossRefEntryProd.id);
      assert("Found cross-referenced production entry in output", !!crossRefEntry);
      if (crossRefEntry) {
        const expandedValue = crossRefEntry._featured_entry_expanded;
        assert("Expanded relation belonging to Staging environment is filtered out (undefined)", expandedValue === undefined);
      }
    }

    // Test Case 4: Cache Isolation Response Headers
    {
      const reqProd = createReq(`http://localhost:3000/api/v1/entries/${collection.slug}`, "GET", prodKey.raw);
      const resProd = await getEntries(reqProd, { params: Promise.resolve({ collectionSlug: collection.slug }) });
      
      assert("Response contains X-Environment-Id header", resProd.headers.has("X-Environment-Id"));
      assert("X-Environment-Id value matches Production environment", resProd.headers.get("X-Environment-Id") === envProd.id);
      assert("Vary header includes X-Environment-Id", resProd.headers.get("Vary")?.includes("X-Environment-Id") === true);
      assert("X-Cache-Tag includes environment ID", resProd.headers.get("X-Cache-Tag")?.includes(`env:${envProd.id}`) === true);
    }

    // Test Case 5: Preview Token Environment Matching
    {
      // Create a draft token bound to Staging environment
      const stagingDraftToken = await prisma.draftToken.create({
        data: {
          workspaceId: workspace.id,
          environmentId: envStaging.id,
          name: "Staging Preview Token",
          token: `token_staging_${suffix}`,
          expiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });

      // Try verifying Staging draft preview token using Production environment context (should block)
      const resProd = await verifyDraftPreview({
        tokenValue: stagingDraftToken.token,
        workspaceId: workspace.id,
        collectionSlug: collection.slug,
        environmentId: envProd.id,
      });
      assert("Preview token with mismatched environment is rejected", resProd.allowed === false);
      assert("Mismatched environment preview returns correct error status", resProd.errorResponse?.status === 403);
      assert("Mismatched environment preview returns correct error code", resProd.errorResponse?.code === "FORBIDDEN");

      // Verify Staging draft preview token with Staging environment context (should allow)
      const resStaging = await verifyDraftPreview({
        tokenValue: stagingDraftToken.token,
        workspaceId: workspace.id,
        collectionSlug: collection.slug,
        environmentId: envStaging.id,
      });
      assert("Preview token with matching environment is allowed", resStaging.allowed === true);
    }

    // Test Case 6: Webhooks Environment Isolation Dispatching
    {
      // Dispatch webhook for a production entry event
      dispatchedWebhooksList = [];
      await dispatchWebhooks(workspace.id, "ENTRY_PUBLISHED", {
        entryId: entryProd.id,
        environmentId: envProd.id,
      });

      // Staging webhooks should NOT be notified; global and production webhooks should be notified
      const notifiedGlobalProd = dispatchedWebhooksList.some(w => w.webhookId === webhookGlobal.id);
      const notifiedProd = dispatchedWebhooksList.some(w => w.webhookId === webhookProd.id);
      const notifiedStagingProd = dispatchedWebhooksList.some(w => w.webhookId === webhookStaging.id);

      assert("Production event triggers global (workspace-wide) webhook", notifiedGlobalProd);
      assert("Production event triggers production webhook", notifiedProd);
      assert("Production event DOES NOT trigger staging webhook", !notifiedStagingProd);

      // Dispatch webhook for a staging entry event
      dispatchedWebhooksList = [];
      await dispatchWebhooks(workspace.id, "ENTRY_PUBLISHED", {
        entryId: entryStaging.id,
        environmentId: envStaging.id,
      });

      // Production webhooks should NOT be notified; global and staging webhooks should be notified
      const notifiedGlobalStg = dispatchedWebhooksList.some(w => w.webhookId === webhookGlobal.id);
      const notifiedProdStg = dispatchedWebhooksList.some(w => w.webhookId === webhookProd.id);
      const notifiedStagingStg = dispatchedWebhooksList.some(w => w.webhookId === webhookStaging.id);

      assert("Staging event triggers global (workspace-wide) webhook", notifiedGlobalStg);
      assert("Staging event triggers staging webhook", notifiedStagingStg);
      assert("Staging event DOES NOT trigger production webhook", !notifiedProdStg);
    }

  } catch (err) {
    console.error("Error running Environment Isolation tests:", err);
    failed++;
  } finally {
    console.log("\nCleaning up seeded database records...");
    await prisma.workspace.delete({ where: { id: workspace.id } }).catch((e) => {
      console.error("Workspace cleanup failed:", e);
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

runEnvironmentIsolationTests().catch((err) => {
  console.error("Unhandled test runner error:", err);
  process.exit(1);
});
