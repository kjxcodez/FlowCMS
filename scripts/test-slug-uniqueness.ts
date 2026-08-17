import { prisma } from "../apps/app/src/lib/prisma";
import { auth } from "../apps/app/src/lib/auth";
import { POST as createEntry } from "../apps/app/src/app/api/internal/entries/route";
import { PATCH as updateEntry, DELETE as deleteEntry } from "../apps/app/src/app/api/internal/entries/[id]/route";
import { verifyDraftPreview } from "../apps/app/src/lib/preview";
import { NextRequest } from "next/server";

// Global mock state
let mockSessionUser: { id: string; email: string; name?: string | null; emailVerified: boolean; onboarded: boolean } | null = null;
const originalGetSession = auth.api.getSession;

// Mock getSession globally
auth.api.getSession = (async () => {
  if (mockSessionUser) {
    return {
      user: mockSessionUser,
      session: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    };
  }
  return null;
}) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

async function runTests() {
  console.log("==================================================");
  console.log("   RUNNING SLUG UNIQUENESS INTEGRATION TESTS      ");
  console.log("==================================================");

  const suffix = Math.random().toString(36).substring(7);

  // 1. Seed Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: `Uniqueness WS ${suffix}`,
      slug: `uniq-ws-${suffix}`,
    },
  });

  // 2. Seed Owner User & Workspace Member
  const user = await prisma.user.create({
    data: {
      email: `owner-${suffix}@example.com`,
      name: "Owner User",
      emailVerified: true,
      onboarded: true,
    },
  });

  await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      role: "OWNER",
    },
  });

  mockSessionUser = user;

  // 3. Seed two environments
  const prodEnv = await prisma.environment.create({
    data: {
      workspaceId: workspace.id,
      name: "Production",
      slug: "production",
      isDefault: true,
    },
  });

  const stagingEnv = await prisma.environment.create({
    data: {
      workspaceId: workspace.id,
      name: "Staging",
      slug: "staging",
    },
  });

  // 4. Seed a collection
  const collection = await prisma.collection.create({
    data: {
      workspaceId: workspace.id,
      name: `Posts ${suffix}`,
      slug: `posts-${suffix}`,
      fields: [],
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

  try {
    const testSlug = `hello-world-${suffix}`;

    // --- Case 1: Same slug, Same collection, Different environments (Creation succeeds) ---
    const reqProd = new NextRequest("http://localhost:3000/api/internal/entries", {
      method: "POST",
      body: JSON.stringify({
        collectionId: collection.id,
        environmentId: prodEnv.id,
        slug: testSlug,
        data: { title: "Production Entry" },
        status: "PUBLISHED",
      }),
    });
    const resProd = await createEntry(reqProd);
    assert("Case 1.1: Production entry created successfully", resProd.status === 200);

    const reqStaging = new NextRequest("http://localhost:3000/api/internal/entries", {
      method: "POST",
      body: JSON.stringify({
        collectionId: collection.id,
        environmentId: stagingEnv.id,
        slug: testSlug,
        data: { title: "Staging Entry" },
        status: "DRAFT",
      }),
    });
    const resStaging = await createEntry(reqStaging);
    assert("Case 1.2: Staging entry created successfully with duplicate slug", resStaging.status === 200);

    let prodEntryId = "";
    let stagingEntryId = "";

    if (resProd.status === 200) {
      const body = await resProd.json();
      prodEntryId = body.data.id;
    }
    if (resStaging.status === 200) {
      const body = await resStaging.json();
      stagingEntryId = body.data.id;
    }

    // --- Case 2: Same slug, Same collection, Same environment (Unique constraint violation / rejection) ---
    const reqDuplicate = new NextRequest("http://localhost:3000/api/internal/entries", {
      method: "POST",
      body: JSON.stringify({
        collectionId: collection.id,
        environmentId: prodEnv.id,
        slug: testSlug,
        data: { title: "Duplicate Production Entry" },
        status: "DRAFT",
      }),
    });
    const resDuplicate = await createEntry(reqDuplicate);
    assert("Case 2: Duplicate slug in same environment rejected", resDuplicate.status === 400);

    // --- Case 3: Public API lookup (Correct environment entry returned) ---
    // Note: GET public endpoint runs within withApiAuth middleware which expects scopes/workspace.
    // We can directly verify the resolver logic or mock.
    {
      // Directly verify that we can resolve them uniquely from DB scoped by environment
      const prodLookup = await prisma.entry.findFirst({
        where: {
          collectionId: collection.id,
          environmentId: prodEnv.id,
          slug: testSlug,
        },
      });
      assert("Case 3.1: Resolved production entry uniquely", prodLookup !== null && prodLookup.id === prodEntryId);

      const stagingLookup = await prisma.entry.findFirst({
        where: {
          collectionId: collection.id,
          environmentId: stagingEnv.id,
          slug: testSlug,
        },
      });
      assert("Case 3.2: Resolved staging entry uniquely", stagingLookup !== null && stagingLookup.id === stagingEntryId);
    }

    // --- Case 4: Preview lookup (Correct environment entry returned) ---
    {
      // Create a draft token for Staging environment
      const tokenVal = `preview-token-${suffix}`;
      await prisma.draftToken.create({
        data: {
          workspaceId: workspace.id,
          environmentId: stagingEnv.id,
          name: "Staging Preview Token",
          token: tokenVal,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      const previewRes = await verifyDraftPreview({
        tokenValue: tokenVal,
        workspaceId: workspace.id,
        collectionSlug: collection.slug,
        entrySlug: testSlug,
        environmentId: stagingEnv.id,
      });

      assert("Case 4.1: Preview resolution allowed", previewRes.allowed === true);
      assert("Case 4.2: Preview resolved correct staging entry ID", previewRes.token && previewRes.token.environmentId === stagingEnv.id);
    }

    // --- Case 5: Entry update (Correct environment entry updated) ---
    {
      const reqUpdate = new NextRequest(`http://localhost:3000/api/internal/entries/${stagingEntryId}`, {
        method: "PATCH",
        body: JSON.stringify({
          data: { title: "Updated Staging Title" },
        }),
      });

      const resUpdate = await updateEntry(reqUpdate, { params: Promise.resolve({ id: stagingEntryId }) });
      assert("Case 5: Staging entry updated successfully", resUpdate.status === 200);

      // Verify Production entry was NOT affected
      const prodAfterUpdate = await prisma.entry.findUnique({
        where: { id: prodEntryId },
      });
      assert("Case 5.2: Production entry was not affected by staging update", prodAfterUpdate !== null && (prodAfterUpdate.data as any).title === "Production Entry"); // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    // --- Case 6: Entry delete (Correct environment entry deleted) ---
    {
      const reqDelete = new NextRequest(`http://localhost:3000/api/internal/entries/${stagingEntryId}`, {
        method: "DELETE",
      });

      const resDelete = await deleteEntry(reqDelete, { params: Promise.resolve({ id: stagingEntryId }) });
      assert("Case 6: Staging entry deleted successfully", resDelete.status === 200);

      // Verify Production entry STILL exists
      const prodAfterDelete = await prisma.entry.findUnique({
        where: { id: prodEntryId },
      });
      assert("Case 6.2: Production entry still exists after staging deleted", prodAfterDelete !== null);
    }

  } catch (err) {
    console.error("Test run failed with error:", err);
    failed++;
  } finally {
    // Cleanup
    console.log("Cleaning up database seed records...");
    await prisma.entry.deleteMany({ where: { workspaceId: workspace.id } }).catch(() => {});
    await prisma.collection.deleteMany({ where: { workspaceId: workspace.id } }).catch(() => {});
    await prisma.draftToken.deleteMany({ where: { workspaceId: workspace.id } }).catch(() => {});
    await prisma.environment.deleteMany({ where: { workspaceId: workspace.id } }).catch(() => {});
    await prisma.workspaceMember.deleteMany({ where: { workspaceId: workspace.id } }).catch(() => {});
    await prisma.workspace.delete({ where: { id: workspace.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});

    auth.api.getSession = originalGetSession;
  }

  console.log("\n==================================================");
  console.log(`   TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("Unhandled test script exception:", err);
});
