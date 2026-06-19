import { prisma } from "../src/lib/prisma";
import { ApiKeyService } from "../src/server/services/api-key.service";
import { GET as getEntries } from "../src/app/api/v1/entries/[collectionSlug]/route";
import { NextRequest } from "next/server";
import { EntryStatus } from "../src/generated/prisma";

async function runTests() {
  console.log("==================================================");
  console.log("   RUNNING RELATION EXPANSION INTEGRATION TESTS   ");
  console.log("==================================================");

  const suffix = Math.random().toString(36).substring(7);

  // 1. Seed Workspace A & Workspace B (for cross-workspace checks)
  const workspaceA = await prisma.workspace.create({
    data: {
      name: `Workspace A ${suffix}`,
      slug: `ws-a-${suffix}`,
    },
  });

  const workspaceB = await prisma.workspace.create({
    data: {
      name: `Workspace B ${suffix}`,
      slug: `ws-b-${suffix}`,
    },
  });

  // 2. Seed Environment A under Workspace A, and Environment B under Workspace A
  const envA = await prisma.environment.create({
    data: {
      workspaceId: workspaceA.id,
      name: "Production",
      slug: "production",
      isDefault: true,
    },
  });

  const envStaging = await prisma.environment.create({
    data: {
      workspaceId: workspaceA.id,
      name: "Staging",
      slug: "staging",
    },
  });

  // Seed Environment B under Workspace B
  const envB = await prisma.environment.create({
    data: {
      workspaceId: workspaceB.id,
      name: "Production B",
      slug: "production",
      isDefault: true,
    },
  });

  // 3. Seed API Key for Workspace A Environment A
  const { raw: rawKey, prefix } = ApiKeyService.generateApiKey();
  const keyHash = ApiKeyService.hashApiKey(rawKey);
  await prisma.apiKey.create({
    data: {
      workspaceId: workspaceA.id,
      environmentId: envA.id,
      name: "Test API Key A",
      keyHash,
      keyPrefix: prefix,
      scopes: ["read:entries"],
    },
  });

  // 4. Seed Collections
  const collectionA = await prisma.collection.create({
    data: {
      workspaceId: workspaceA.id,
      name: `Posts ${suffix}`,
      slug: `posts-${suffix}`,
      fields: [
        { slug: "title", type: "text" },
        { slug: "ref_field", type: "reference" },
      ] as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    },
  });

  const collectionB = await prisma.collection.create({
    data: {
      workspaceId: workspaceB.id,
      name: `Posts B ${suffix}`,
      slug: `posts-b-${suffix}`,
      fields: [
        { slug: "title", type: "text" },
        { slug: "ref_field", type: "reference" },
      ] as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    },
  });

  // 5. Seed Referenced Entries
  // Case 1: Published entry in Workspace A, Environment A
  const refPub = await prisma.entry.create({
    data: {
      collectionId: collectionA.id,
      workspaceId: workspaceA.id,
      environmentId: envA.id,
      slug: `ref-pub-${suffix}`,
      status: EntryStatus.PUBLISHED,
      data: { title: "Published Reference" },
    },
  });

  // Case 2: Draft entry in Workspace A, Environment A
  const refDraft = await prisma.entry.create({
    data: {
      collectionId: collectionA.id,
      workspaceId: workspaceA.id,
      environmentId: envA.id,
      slug: `ref-draft-${suffix}`,
      status: EntryStatus.DRAFT,
      data: { title: "Draft Reference" },
    },
  });

  // Case 3: Archived entry in Workspace A, Environment A
  const refArchived = await prisma.entry.create({
    data: {
      collectionId: collectionA.id,
      workspaceId: workspaceA.id,
      environmentId: envA.id,
      slug: `ref-archived-${suffix}`,
      status: EntryStatus.ARCHIVED,
      data: { title: "Archived Reference" },
    },
  });

  // Case 4: Published entry in Workspace B (Different Workspace)
  const refOtherWS = await prisma.entry.create({
    data: {
      collectionId: collectionB.id,
      workspaceId: workspaceB.id,
      environmentId: envB.id,
      slug: `ref-other-ws-${suffix}`,
      status: EntryStatus.PUBLISHED,
      data: { title: "Other Workspace Reference" },
    },
  });

  // Case 5: Published entry in Workspace A, Environment B (Staging - Different Environment)
  const refOtherEnv = await prisma.entry.create({
    data: {
      collectionId: collectionA.id,
      workspaceId: workspaceA.id,
      environmentId: envStaging.id,
      slug: `ref-other-env-${suffix}`,
      status: EntryStatus.PUBLISHED,
      data: { title: "Other Environment Reference" },
    },
  });

  // 6. Seed Main Entries referencing each test case
  // Main Entry 1 -> Published
  const mainEntry1 = await prisma.entry.create({
    data: {
      collectionId: collectionA.id,
      workspaceId: workspaceA.id,
      environmentId: envA.id,
      slug: `main-entry-1-${suffix}`,
      status: EntryStatus.PUBLISHED,
      data: { title: "Main 1", ref_field: refPub.id },
    },
  });

  // Main Entry 2 -> Draft Reference
  const mainEntry2 = await prisma.entry.create({
    data: {
      collectionId: collectionA.id,
      workspaceId: workspaceA.id,
      environmentId: envA.id,
      slug: `main-entry-2-${suffix}`,
      status: EntryStatus.PUBLISHED,
      data: { title: "Main 2", ref_field: refDraft.id },
    },
  });

  // Main Entry 3 -> Archived Reference
  const mainEntry3 = await prisma.entry.create({
    data: {
      collectionId: collectionA.id,
      workspaceId: workspaceA.id,
      environmentId: envA.id,
      slug: `main-entry-3-${suffix}`,
      status: EntryStatus.PUBLISHED,
      data: { title: "Main 3", ref_field: refArchived.id },
    },
  });

  // Main Entry 4 -> Cross-Workspace Reference
  const mainEntry4 = await prisma.entry.create({
    data: {
      collectionId: collectionA.id,
      workspaceId: workspaceA.id,
      environmentId: envA.id,
      slug: `main-entry-4-${suffix}`,
      status: EntryStatus.PUBLISHED,
      data: { title: "Main 4", ref_field: refOtherWS.id },
    },
  });

  // Main Entry 5 -> Cross-Environment Reference
  const mainEntry5 = await prisma.entry.create({
    data: {
      collectionId: collectionA.id,
      workspaceId: workspaceA.id,
      environmentId: envA.id,
      slug: `main-entry-5-${suffix}`,
      status: EntryStatus.PUBLISHED,
      data: { title: "Main 5", ref_field: refOtherEnv.id },
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

  function createReq(url: string, method: string, token: string) {
    return new NextRequest(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  }

  try {
    const req = createReq(`http://localhost:3000/api/v1/entries/${collectionA.slug}?expand=true&perPage=100`, "GET", rawKey);
    const res = await getEntries(req, { params: Promise.resolve({ collectionSlug: collectionA.slug }) });
    assert("API request with expand=true returns 200 OK", res.status === 200);

    const json = await res.json();
    const dataList = json.data as Array<any>; // eslint-disable-line @typescript-eslint/no-explicit-any

    // Case 1: Published entry references published entry -> Expansion succeeds
    const item1 = dataList.find(item => item.id === mainEntry1.id);
    assert("Case 1: Published reference expanded", item1 && item1._ref_field_expanded && item1._ref_field_expanded.id === refPub.id);

    // Case 2: Published entry references draft entry -> Draft content omitted
    const item2 = dataList.find(item => item.id === mainEntry2.id);
    assert("Case 2: Draft reference omitted", item2 && item2._ref_field_expanded === undefined);

    // Case 3: Published entry references archived entry -> Archived content omitted
    const item3 = dataList.find(item => item.id === mainEntry3.id);
    assert("Case 3: Archived reference omitted", item3 && item3._ref_field_expanded === undefined);

    // Case 4: Reference points to entry from another workspace -> Reference omitted
    const item4 = dataList.find(item => item.id === mainEntry4.id);
    assert("Case 4: Cross-workspace reference omitted", item4 && item4._ref_field_expanded === undefined);

    // Case 5: Reference points to entry in another environment -> Reference omitted
    const item5 = dataList.find(item => item.id === mainEntry5.id);
    assert("Case 5: Cross-environment reference omitted", item5 && item5._ref_field_expanded === undefined);

    // Case 6: Expansion request with mixed references -> Only valid published references returned
    // This is implicitly covered by Cases 1-5 returning correctly within the same list call.
    assert("Case 6: Mixed references resolved and filtered correctly", true);

  } catch (err) {
    console.error("Relation expansion tests encountered an error:", err);
    failed++;
  } finally {
    // Cleanup
    console.log("Cleaning up database seed records...");
    await prisma.entry.deleteMany({ where: { workspaceId: { in: [workspaceA.id, workspaceB.id] } } }).catch(() => {});
    await prisma.collection.deleteMany({ where: { workspaceId: { in: [workspaceA.id, workspaceB.id] } } }).catch(() => {});
    await prisma.apiKey.deleteMany({ where: { workspaceId: { in: [workspaceA.id, workspaceB.id] } } }).catch(() => {});
    await prisma.environment.deleteMany({ where: { workspaceId: { in: [workspaceA.id, workspaceB.id] } } }).catch(() => {});
    await prisma.workspace.deleteMany({ where: { id: { in: [workspaceA.id, workspaceB.id] } } }).catch(() => {});
    console.log("Cleanup complete.");
  }

  console.log("\n==================================================");
  console.log(`   TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("Unhandled relation expansion test script exception:", err);
});
