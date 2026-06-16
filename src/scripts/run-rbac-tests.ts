import { prisma } from "../lib/prisma";
import { auth } from "../lib/auth";
import { qstash } from "../lib/qstash";
import { testCollections } from "./tests/rbac/collections.test";
import { testEntries } from "./tests/rbac/entries.test";
import { testMedia } from "./tests/rbac/media.test";
import { testWebhooks } from "./tests/rbac/webhooks.test";
import { testWorkspace } from "./tests/rbac/workspace.test";

// Global mock state
let mockSessionUser: any = null;
const originalGetSession = auth.api.getSession;

// Mock QStash publishJSON method to bypass network calls
qstash.publishJSON = async (options: any) => {
  return { messageId: "mock-qstash-msg-id" } as any;
};

// Override getSession globally
auth.api.getSession = (async (options?: any) => {
  if (mockSessionUser) {
    return {
      user: mockSessionUser,
      session: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    };
  }
  return null;
}) as any;

export function setMockUser(user: any) {
  mockSessionUser = user;
}

async function runAllTests() {
  console.log("==================================================");
  console.log("   RUNNING FLOWCMS RBAC INTEGRATION TESTS         ");
  console.log("==================================================");

  const suffix = Math.random().toString(36).substring(7);

  // 1. Seed Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: `RBAC Test WS ${suffix}`,
      slug: `rbac-test-ws-${suffix}`,
    },
  });

  // 2. Seed Users & Workspace Memberships
  const roles = ["OWNER", "ADMIN", "EDITOR", "VIEWER"] as const;
  const users: Record<string, any> = {};

  for (const role of roles) {
    const email = `user-${role.toLowerCase()}-${suffix}@example.com`;
    const user = await prisma.user.create({
      data: {
        email,
        name: `${role} User`,
        emailVerified: true,
        onboarded: true,
      },
    });

    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role,
      },
    });

    users[role] = user;
  }

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

  const ctx = { workspace, users, assert };

  try {
    console.log("\n--- Testing Collections Component ---");
    await testCollections(ctx);

    console.log("\n--- Testing Entries Component ---");
    await testEntries(ctx);

    console.log("\n--- Testing Media Component ---");
    await testMedia(ctx);

    console.log("\n--- Testing Webhooks Component ---");
    await testWebhooks(ctx);

    console.log("\n--- Testing Workspace / Billing / Members Component ---");
    await testWorkspace(ctx);

  } catch (err) {
    console.error("\nUnexpected error during test execution:", err);
    failed++;
  } finally {
    console.log("\nCleaning up seeded database records...");

    // Delete members & workspace (workspace deletion has cascade delete in DB)
    await prisma.workspace.delete({ where: { id: workspace.id } }).catch((e) => {
      console.error("Failed to delete workspace:", e);
    });

    // Delete users
    for (const role of roles) {
      if (users[role]) {
        await prisma.user.delete({ where: { id: users[role].id } }).catch((e) => {
          console.error(`Failed to delete user ${role}:`, e);
        });
      }
    }

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

runAllTests().catch((err) => {
  console.error("Unhandled rejection in test runner:", err);
  process.exit(1);
});
