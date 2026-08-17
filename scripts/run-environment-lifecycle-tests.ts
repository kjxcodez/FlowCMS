/* eslint-disable */
import { prisma } from "../apps/app/src/lib/prisma";
import { auth } from "../apps/app/src/lib/auth";
import { NextRequest } from "next/server";
import { POST as createEnvironment } from "../apps/app/src/app/api/internal/environments/route";
import { PATCH as updateEnvironment, DELETE as deleteEnvironment } from "../apps/app/src/app/api/internal/environments/[envId]/route";

// Global mock state
let mockSessionUser: any = null;
const originalGetSession = auth.api.getSession;

// Override getSession globally to simulate logged-in user
auth.api.getSession = (async () => {
  if (mockSessionUser) {
    return {
      user: mockSessionUser,
      session: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    };
  }
  return null;
}) as any;

function setMockUser(user: any) {
  mockSessionUser = user;
}

async function runEnvironmentLifecycleTests() {
  console.log("==================================================");
  console.log("   RUNNING FLOWCMS ENVIRONMENT LIFECYCLE TESTS    ");
  console.log("==================================================");

  const suffix = Math.random().toString(36).substring(7);

  // 1. Seed Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: `Lifecycle Test WS ${suffix}`,
      slug: `lifecycle-test-ws-${suffix}`,
      plan: "PRO" // Pro plan allows multiple environments
    },
  });

  // Seed default Environment
  const envProd = await prisma.environment.create({
    data: {
      workspaceId: workspace.id,
      name: "Production",
      slug: "production",
      isDefault: true,
    },
  });

  // 2. Seed Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: `admin-${suffix}@example.com`,
      name: "Admin User",
      emailVerified: true,
      onboarded: true,
    },
  });

  // Add membership
  await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: adminUser.id,
      role: "OWNER"
    }
  });

  setMockUser(adminUser);

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

  function createReq(url: string, method: string, body?: any) {
    return new NextRequest(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined
    });
  }

  try {
    // 1. Create a Staging Environment
    let stagingEnvId = "";
    {
      const req = createReq("http://localhost/api/internal/environments", "POST", { name: "Staging" });
      const res = await createEnvironment(req);
      assert("Create environment request returns 200", res.status === 200, `Status: ${res.status}`);
      const json = await res.json();
      assert("Create environment returns success structure", json.success === true, JSON.stringify(json));
      assert("Create environment matches name", json.data?.name === "Staging");
      assert("Create environment has correct default setting (false)", json.data?.isDefault === false);
      stagingEnvId = json.data?.id;
    }

    // 2. Set Staging Environment as Default
    {
      const req = createReq(`http://localhost/api/internal/environments/${stagingEnvId}`, "PATCH", { isDefault: true });
      const res = await updateEnvironment(req, { params: Promise.resolve({ envId: stagingEnvId }) });
      assert("Set default environment request returns 200", res.status === 200, `Status: ${res.status}`);
      const json = await res.json();
      assert("Set default returns success status", json.success === true, JSON.stringify(json));

      // Verify DB state
      const dbStaging = await prisma.environment.findUnique({ where: { id: stagingEnvId } });
      const dbProd = await prisma.environment.findUnique({ where: { id: envProd.id } });
      assert("Staging is now default", dbStaging?.isDefault === true);
      assert("Production is no longer default", dbProd?.isDefault === false);
    }

    // 3. Rename Staging Environment
    {
      const req = createReq(`http://localhost/api/internal/environments/${stagingEnvId}`, "PATCH", { name: "Stage v2" });
      const res = await updateEnvironment(req, { params: Promise.resolve({ envId: stagingEnvId }) });
      assert("Rename environment request returns 200", res.status === 200, `Status: ${res.status}`);
      const json = await res.json();
      assert("Rename returns success status", json.success === true, JSON.stringify(json));
      assert("Rename returns new name", json.data?.name === "Stage v2");
      assert("Rename returns new slug", json.data?.slug === "stage-v2");

      const dbStaging = await prisma.environment.findUnique({ where: { id: stagingEnvId } });
      assert("DB name matches new name", dbStaging?.name === "Stage v2");
      assert("DB slug matches new slug", dbStaging?.slug === "stage-v2");
    }

    // 4. Try renaming Production environment name vs slug
    {
      // We can rename name but the slug of production should remain protected
      const req = createReq(`http://localhost/api/internal/environments/${envProd.id}`, "PATCH", { name: "Prod environment" });
      const res = await updateEnvironment(req, { params: Promise.resolve({ envId: envProd.id }) });
      assert("Rename production name returns 200", res.status === 200, `Status: ${res.status}`);
      
      const dbProd = await prisma.environment.findUnique({ where: { id: envProd.id } });
      assert("Production name updated", dbProd?.name === "Prod environment");
      assert("Production slug remains protected", dbProd?.slug === "production");
    }

    // 5. Try deleting Production (Default-eligible or slug protected) environment (should fail)
    {
      const req = createReq(`http://localhost/api/internal/environments/${envProd.id}`, "DELETE");
      const res = await deleteEnvironment(req, { params: Promise.resolve({ envId: envProd.id }) });
      assert("Delete production environment is blocked (not 200)", res.status !== 200, `Status: ${res.status}`);
      const json = await res.json();
      assert("Delete production environment failure message structured", json.success === false && json.error?.code === "INVALID_ACTION");
    }

    // 6. Delete Staging Environment
    {
      // First make Production default again so Staging can be deleted (isDefault environment cannot be deleted)
      await prisma.environment.update({ where: { id: envProd.id }, data: { isDefault: true } });
      await prisma.environment.update({ where: { id: stagingEnvId }, data: { isDefault: false } });

      const req = createReq(`http://localhost/api/internal/environments/${stagingEnvId}`, "DELETE");
      const res = await deleteEnvironment(req, { params: Promise.resolve({ envId: stagingEnvId }) });
      assert("Delete staging environment request returns 200", res.status === 200, `Status: ${res.status}`);
      
      const dbStaging = await prisma.environment.findUnique({ where: { id: stagingEnvId } });
      assert("Staging environment is deleted from DB", dbStaging === null);
    }

  } catch (err) {
    console.error("Unexpected error during test execution:", err);
    failed++;
  } finally {
    console.log("\nCleaning up seeded database records...");
    await prisma.workspace.delete({ where: { id: workspace.id } }).catch((e) => {
      console.error("Workspace cleanup failed:", e);
    });
    await prisma.user.delete({ where: { id: adminUser.id } }).catch((e) => {
      console.error("User cleanup failed:", e);
    });
    console.log("Cleanup complete.");
  }

  // Restore getSession
  auth.api.getSession = originalGetSession;

  console.log("\n==================================================");
  console.log(`   TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runEnvironmentLifecycleTests().catch((err) => {
  console.error("Unhandled test runner error:", err);
  process.exit(1);
});
