import { prisma } from "../lib/prisma";
import { verifyDraftPreview } from "../lib/preview";

async function runTests() {
  console.log("=== STARTING DRAFT PREVIEW SECURITY TESTS ===");
  
  // 1. Seed test data
  const suffix = Math.random().toString(36).substring(7);
  
  console.log(`Seeding test data with suffix: ${suffix}...`);
  
  const workspace1 = await prisma.workspace.create({
    data: {
      name: `Test WS 1 ${suffix}`,
      slug: `test-ws-1-${suffix}`,
    },
  });

  const workspace2 = await prisma.workspace.create({
    data: {
      name: `Test WS 2 ${suffix}`,
      slug: `test-ws-2-${suffix}`,
    },
  });

  const environment1 = await prisma.environment.create({
    data: {
      workspaceId: workspace1.id,
      name: "Staging",
      slug: "staging",
    },
  });

  const environment2 = await prisma.environment.create({
    data: {
      workspaceId: workspace1.id,
      name: "Production",
      slug: "production",
    },
  });

  const collection1 = await prisma.collection.create({
    data: {
      workspaceId: workspace1.id,
      name: "Posts",
      slug: "posts",
      fields: [],
    },
  });

  const collection2 = await prisma.collection.create({
    data: {
      workspaceId: workspace1.id,
      name: "Pages",
      slug: "pages",
      fields: [],
    },
  });

  // Entry 1: Draft in staging
  const draftEntry = await prisma.entry.create({
    data: {
      collectionId: collection1.id,
      workspaceId: workspace1.id,
      environmentId: environment1.id,
      slug: "my-draft-post",
      data: { title: "My Draft Post" },
      status: "DRAFT",
    },
  });

  // Entry 2: Published
  const publishedEntry = await prisma.entry.create({
    data: {
      collectionId: collection1.id,
      workspaceId: workspace1.id,
      environmentId: environment1.id,
      slug: "my-published-post",
      data: { title: "My Published Post" },
      status: "PUBLISHED",
    },
  });

  // Tokens
  const validToken = await prisma.draftToken.create({
    data: {
      workspaceId: workspace1.id,
      name: "Valid Token",
      token: `tok_valid_${suffix}`,
      active: true,
    },
  });

  const expiredToken = await prisma.draftToken.create({
    data: {
      workspaceId: workspace1.id,
      name: "Expired Token",
      token: `tok_expired_${suffix}`,
      active: true,
      expiresAt: new Date(Date.now() - 10000), // Expired 10s ago
    },
  });

  const revokedToken = await prisma.draftToken.create({
    data: {
      workspaceId: workspace1.id,
      name: "Revoked Token",
      token: `tok_revoked_${suffix}`,
      active: false,
    },
  });

  const wrongWorkspaceToken = await prisma.draftToken.create({
    data: {
      workspaceId: workspace2.id, // Wrong workspace
      name: "Wrong WS Token",
      token: `tok_wrong_ws_${suffix}`,
      active: true,
    },
  });

  const stagingToken = await prisma.draftToken.create({
    data: {
      workspaceId: workspace1.id,
      environmentId: environment1.id,
      name: "Staging Token",
      token: `tok_staging_${suffix}`,
      active: true,
    },
  });

  const wrongEnvToken = await prisma.draftToken.create({
    data: {
      workspaceId: workspace1.id,
      environmentId: environment2.id,
      name: "Wrong Env Token",
      token: `tok_wrong_env_${suffix}`,
      active: true,
    },
  });

  const collectionScopedToken = await prisma.draftToken.create({
    data: {
      workspaceId: workspace1.id,
      name: "Collection Scoped",
      token: `tok_coll_scoped_${suffix}`,
      active: true,
      allowedCollectionId: collection1.id, // Only allowed for collection1
    },
  });

  const entryScopedToken = await prisma.draftToken.create({
    data: {
      workspaceId: workspace1.id,
      name: "Entry Scoped",
      token: `tok_entry_scoped_${suffix}`,
      active: true,
      allowedEntryId: draftEntry.id, // Only allowed for this entry
    },
  });

  let passed = 0;
  let failed = 0;

  function assert(testName: string, condition: boolean, message: string = "") {
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.log(`✗ [FAIL] ${testName}: ${message}`);
      failed++;
    }
  }

  try {
    // Test 1: Valid Token
    {
      const res = await verifyDraftPreview({
        tokenValue: validToken.token,
        workspaceId: workspace1.id,
        collectionSlug: "posts",
        entrySlug: "my-draft-post",
      });
      assert("Valid Token allows preview", res.allowed === true);
    }

    // Test 2: Expired Token
    {
      const res = await verifyDraftPreview({
        tokenValue: expiredToken.token,
        workspaceId: workspace1.id,
        collectionSlug: "posts",
        entrySlug: "my-draft-post",
      });
      assert("Expired Token blocks preview", res.allowed === false, "Allowed expired token");
      assert("Expired Token returns 401", res.errorResponse?.status === 401, `Returned status: ${res.errorResponse?.status}`);
    }

    // Test 3: Revoked Token
    {
      const res = await verifyDraftPreview({
        tokenValue: revokedToken.token,
        workspaceId: workspace1.id,
        collectionSlug: "posts",
        entrySlug: "my-draft-post",
      });
      assert("Revoked Token blocks preview", res.allowed === false, "Allowed revoked token");
      assert("Revoked Token returns 403", res.errorResponse?.status === 403, `Returned status: ${res.errorResponse?.status}`);
    }

    // Test 4: Wrong Workspace Token
    {
      const res = await verifyDraftPreview({
        tokenValue: wrongWorkspaceToken.token,
        workspaceId: workspace1.id,
        collectionSlug: "posts",
        entrySlug: "my-draft-post",
      });
      assert("Wrong Workspace Token blocks preview", res.allowed === false, "Allowed wrong workspace token");
      assert("Wrong Workspace Token returns 403", res.errorResponse?.status === 403, `Returned status: ${res.errorResponse?.status}`);
    }

    // Test 5: Wrong Environment Token
    {
      const res = await verifyDraftPreview({
        tokenValue: wrongEnvToken.token,
        workspaceId: workspace1.id,
        collectionSlug: "posts",
        entrySlug: "my-draft-post",
      });
      assert("Wrong Environment Token blocks preview", res.allowed === false, "Allowed wrong environment token");
      assert("Wrong Environment Token returns 403", res.errorResponse?.status === 403, `Returned status: ${res.errorResponse?.status}`);
    }

    // Test 6: Valid Environment Token
    {
      const res = await verifyDraftPreview({
        tokenValue: stagingToken.token,
        workspaceId: workspace1.id,
        collectionSlug: "posts",
        entrySlug: "my-draft-post",
      });
      assert("Matching Environment Token allows preview", res.allowed === true);
    }

    // Test 7: Missing Token
    {
      const res = await verifyDraftPreview({
        tokenValue: null,
        workspaceId: workspace1.id,
        collectionSlug: "posts",
        entrySlug: "my-draft-post",
      });
      assert("Missing Token blocks preview", res.allowed === false);
      assert("Missing Token returns 401", res.errorResponse?.status === 401);
    }

    // Test 8: Invalid Token
    {
      const res = await verifyDraftPreview({
        tokenValue: "tok_invalid_random_token_nonexistent",
        workspaceId: workspace1.id,
        collectionSlug: "posts",
        entrySlug: "my-draft-post",
      });
      assert("Invalid Token blocks preview", res.allowed === false);
      assert("Invalid Token returns 401", res.errorResponse?.status === 401);
    }

    // Test 9: Collection Scoping (Valid collection)
    {
      const res = await verifyDraftPreview({
        tokenValue: collectionScopedToken.token,
        workspaceId: workspace1.id,
        collectionSlug: "posts",
        entrySlug: "my-draft-post",
      });
      assert("Collection Scoped Token allows matching collection", res.allowed === true);
    }

    // Test 10: Collection Scoping (Invalid collection)
    {
      const res = await verifyDraftPreview({
        tokenValue: collectionScopedToken.token,
        workspaceId: workspace1.id,
        collectionSlug: "pages", // Different collection slug
      });
      assert("Collection Scoped Token blocks mismatching collection", res.allowed === false);
      assert("Collection Scoped Token returns 403 on mismatch", res.errorResponse?.status === 403);
    }

    // Test 11: Entry Scoping (Valid entry)
    {
      const res = await verifyDraftPreview({
        tokenValue: entryScopedToken.token,
        workspaceId: workspace1.id,
        collectionSlug: "posts",
        entrySlug: "my-draft-post",
      });
      assert("Entry Scoped Token allows matching entry", res.allowed === true);
    }

    // Test 12: Entry Scoping (Invalid entry)
    {
      // Create another entry to test mismatch
      const otherEntry = await prisma.entry.create({
        data: {
          collectionId: collection1.id,
          workspaceId: workspace1.id,
          slug: "other-post",
          data: { title: "Other Post" },
          status: "DRAFT",
        },
      });

      const res = await verifyDraftPreview({
        tokenValue: entryScopedToken.token,
        workspaceId: workspace1.id,
        collectionSlug: "posts",
        entrySlug: "other-post",
      });
      assert("Entry Scoped Token blocks mismatching entry", res.allowed === false);
      assert("Entry Scoped Token returns 403 on mismatch", res.errorResponse?.status === 403);

      // Clean up other entry
      await prisma.entry.delete({ where: { id: otherEntry.id } });
    }

    // Test 13: Simulated GET Single Entry endpoint behaviour
    {
      // Simulation logic for draft preview:
      const simulateRoute = async (entryStatus: string, previewRequested: boolean, tokenVal: string | null) => {
        if (entryStatus !== "PUBLISHED" && !previewRequested) {
          return { status: 404, allowed: false }; // "Not published" 404
        }
        
        if (previewRequested) {
          const res = await verifyDraftPreview({
            tokenValue: tokenVal,
            workspaceId: workspace1.id,
            collectionSlug: "posts",
            entrySlug: entryStatus === "PUBLISHED" ? "my-published-post" : "my-draft-post",
          });
          
          if (!res.allowed) {
            if (entryStatus !== "PUBLISHED") {
              return { status: res.errorResponse?.status || 401, allowed: false };
            }
          }
        }
        
        return { status: 200, allowed: true };
      };

      // 13a: Draft requested with valid token -> OK (200)
      const r1 = await simulateRoute("DRAFT", true, validToken.token);
      assert("GET draft with valid token returns 200", r1.status === 200);

      // 13b: Draft requested without preview flag -> NOT FOUND (404)
      const r2 = await simulateRoute("DRAFT", false, null);
      assert("GET draft without preview returns 404", r2.status === 404);

      // 13c: Draft requested with preview=true but missing token -> UNAUTHORIZED (401)
      const r3 = await simulateRoute("DRAFT", true, null);
      assert("GET draft with preview but missing token returns 401", r3.status === 401);

      // 13d: Published requested with preview=true but invalid/missing token -> still accessible!
      const r4 = await simulateRoute("PUBLISHED", true, null);
      assert("GET published entry with preview=true and missing token returns 200 (still accessible)", r4.status === 200);
      
      const r5 = await simulateRoute("PUBLISHED", false, null);
      assert("GET published entry without preview returns 200", r5.status === 200);
    }

  } catch (err) {
    console.error("Test execution failed with error:", err);
  } finally {
    // Teardown
    console.log("Cleaning up test data...");
    
    // Delete DraftTokens
    await prisma.draftToken.deleteMany({
      where: {
        workspaceId: { in: [workspace1.id, workspace2.id] },
      },
    });

    // Delete Entries
    await prisma.entry.deleteMany({
      where: {
        workspaceId: { in: [workspace1.id, workspace2.id] },
      },
    });

    // Delete Collections
    await prisma.collection.deleteMany({
      where: {
        workspaceId: { in: [workspace1.id, workspace2.id] },
      },
    });

    // Delete Environments
    await prisma.environment.deleteMany({
      where: {
        workspaceId: { in: [workspace1.id, workspace2.id] },
      },
    });

    // Delete Workspaces
    await prisma.workspace.delete({ where: { id: workspace1.id } });
    await prisma.workspace.delete({ where: { id: workspace2.id } });
    
    console.log("Cleanup finished.");
  }

  console.log(`=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
