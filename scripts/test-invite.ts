import { prisma } from "../apps/app/src/lib/prisma";
import { auth } from "../apps/app/src/lib/auth";
import { GET } from "../apps/app/src/app/api/auth/invite/[token]/route";
import { NextRequest } from "next/server";

// Mock auth session to control logged in state easily during tests
let mockSessionUser: any = null;
const originalGetSession = auth.api.getSession;
auth.api.getSession = (async (options?: any) => {
  if (mockSessionUser) {
    return {
      user: mockSessionUser,
      session: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    };
  }
  return null;
}) as any;

async function runTests() {
  console.log("=== STARTING INVITATION SECURITY TESTS ===");
  
  const suffix = Math.random().toString(36).substring(7);
  console.log(`Seeding test data with suffix: ${suffix}...`);

  // Seed workspaces
  const workspace1 = await prisma.workspace.create({
    data: {
      name: `Invite WS 1 ${suffix}`,
      slug: `invite-ws-1-${suffix}`,
    },
  });

  const workspace2 = await prisma.workspace.create({
    data: {
      name: `Invite WS 2 ${suffix}`,
      slug: `invite-ws-2-${suffix}`,
    },
  });

  // Seed Users
  const userCorrect = await prisma.user.create({
    data: {
      email: `invitee-correct-${suffix}@example.com`,
      name: "Correct Invitee",
    },
  });

  const userIncorrect = await prisma.user.create({
    data: {
      email: `invitee-incorrect-${suffix}@example.com`,
      name: "Incorrect Invitee",
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
    // Test 1: Unauthorized request (no session)
    {
      const token = `tok_unauth_${suffix}`;
      const invitation = await prisma.invitation.create({
        data: {
          workspaceId: workspace1.id,
          email: userCorrect.email,
          token,
          invitedById: userCorrect.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: "PENDING",
        },
      });

      mockSessionUser = null; // Logged out
      const req = new NextRequest(`http://localhost:3000/api/auth/invite/${token}`);
      const res = await GET(req, { params: Promise.resolve({ token }) });
      
      assert("Unauthorized request (no session) returns 401", res.status === 401, `Returned status: ${res.status}`);
      
      // Cleanup invitation
      await prisma.invitation.delete({ where: { id: invitation.id } });
    }

    // Test 2: Deleted / Non-existent invite
    {
      mockSessionUser = userCorrect;
      const token = `tok_nonexistent_${suffix}`;
      const req = new NextRequest(`http://localhost:3000/api/auth/invite/${token}`);
      const res = await GET(req, { params: Promise.resolve({ token }) });
      
      assert("Non-existent invite returns 404", res.status === 404, `Returned status: ${res.status}`);
    }

    // Test 3: Incorrect Email (Hijacking Attempt)
    {
      const token = `tok_hijack_${suffix}`;
      const invitation = await prisma.invitation.create({
        data: {
          workspaceId: workspace1.id,
          email: userCorrect.email, // Intended for userCorrect
          token,
          invitedById: userCorrect.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: "PENDING",
        },
      });

      mockSessionUser = userIncorrect; // Logged in as wrong user
      const req = new NextRequest(`http://localhost:3000/api/auth/invite/${token}`);
      const res = await GET(req, { params: Promise.resolve({ token }) });

      assert("Incorrect email accept attempt returns 403 Forbidden", res.status === 403, `Returned status: ${res.status}`);

      // Verify the invitation status remains PENDING
      const freshInvitation = await prisma.invitation.findUnique({ where: { id: invitation.id } });
      assert("Invitation remains pending on mismatch", freshInvitation?.status === "PENDING");

      // Verify audit logs
      const auditLogMismatch = await prisma.auditLog.findFirst({
        where: {
          workspaceId: workspace1.id,
          action: "INVITE_MISMATCH",
        },
      });
      assert("INVITE_MISMATCH audit log is generated", !!auditLogMismatch);

      const auditLogRejected = await prisma.auditLog.findFirst({
        where: {
          workspaceId: workspace1.id,
          action: "INVITE_REJECTED",
        },
      });
      assert("INVITE_REJECTED audit log is generated", !!auditLogRejected);

      // Cleanup
      await prisma.invitation.delete({ where: { id: invitation.id } });
    }

    // Test 4: Expired Invite
    {
      const token = `tok_expired_${suffix}`;
      const invitation = await prisma.invitation.create({
        data: {
          workspaceId: workspace1.id,
          email: userCorrect.email,
          token,
          invitedById: userCorrect.id,
          expiresAt: new Date(Date.now() - 10000), // Expired 10s ago
          status: "PENDING",
        },
      });

      mockSessionUser = userCorrect;
      const req = new NextRequest(`http://localhost:3000/api/auth/invite/${token}`);
      const res = await GET(req, { params: Promise.resolve({ token }) });

      assert("Expired invite returns 410 Gone", res.status === 410, `Returned status: ${res.status}`);

      // Verify invitation status updated to EXPIRED
      const freshInvitation = await prisma.invitation.findUnique({ where: { id: invitation.id } });
      assert("Invitation status updated to EXPIRED", freshInvitation?.status === "EXPIRED");

      // Verify audit log
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          workspaceId: workspace1.id,
          action: "INVITE_EXPIRED",
        },
      });
      assert("INVITE_EXPIRED audit log is generated", !!auditLog);

      // Cleanup
      await prisma.invitation.delete({ where: { id: invitation.id } });
    }

    // Test 5: Correct Email Accept (Success Case)
    {
      const token = `tok_success_${suffix}`;
      const invitation = await prisma.invitation.create({
        data: {
          workspaceId: workspace1.id,
          email: userCorrect.email,
          token,
          invitedById: userCorrect.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: "PENDING",
        },
      });

      mockSessionUser = userCorrect;
      const req = new NextRequest(`http://localhost:3000/api/auth/invite/${token}`);
      const res = await GET(req, { params: Promise.resolve({ token }) });

      assert("Correct email accept succeeds (200 JSON)", res.status === 200, `Returned status: ${res.status}`);

      // Verify status is ACCEPTED
      const freshInvitation = await prisma.invitation.findUnique({ where: { id: invitation.id } });
      assert("Invitation status updated to ACCEPTED", freshInvitation?.status === "ACCEPTED");

      // Verify workspace membership created
      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: workspace1.id,
            userId: userCorrect.id,
          },
        },
      });
      assert("WorkspaceMember is successfully created", !!member);

      // Verify audit log
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          workspaceId: workspace1.id,
          action: "INVITE_ACCEPTED",
        },
      });
      assert("INVITE_ACCEPTED audit log is generated", !!auditLog);

      // Cleanup invitation & member
      await prisma.invitation.delete({ where: { id: invitation.id } });
      await prisma.workspaceMember.delete({
        where: {
          workspaceId_userId: {
            workspaceId: workspace1.id,
            userId: userCorrect.id,
          },
        },
      });
    }

    // Test 6: Reused invite
    {
      const token = `tok_reused_${suffix}`;
      const invitation = await prisma.invitation.create({
        data: {
          workspaceId: workspace1.id,
          email: userCorrect.email,
          token,
          invitedById: userCorrect.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: "ACCEPTED", // Already accepted
        },
      });

      mockSessionUser = userCorrect;
      const req = new NextRequest(`http://localhost:3000/api/auth/invite/${token}`);
      const res = await GET(req, { params: Promise.resolve({ token }) });

      assert("Reused invite returns 409 Conflict", res.status === 409, `Returned status: ${res.status}`);

      // Cleanup
      await prisma.invitation.delete({ where: { id: invitation.id } });
    }

    // Test 7: Race condition / Concurrent accept attempt
    {
      const token = `tok_race_${suffix}`;
      const invitation = await prisma.invitation.create({
        data: {
          workspaceId: workspace1.id,
          email: userCorrect.email,
          token,
          invitedById: userCorrect.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: "PENDING",
        },
      });

      mockSessionUser = userCorrect;
      const req1 = new NextRequest(`http://localhost:3000/api/auth/invite/${token}`);
      const req2 = new NextRequest(`http://localhost:3000/api/auth/invite/${token}`);

      // Trigger both GET handlers in parallel
      console.log("Simulating concurrent database transactions...");
      const [res1, res2] = await Promise.all([
        GET(req1, { params: Promise.resolve({ token }) }),
        GET(req2, { params: Promise.resolve({ token }) }),
      ]);

      // Exactly one request should succeed (status 200), and the other must be rejected (status 409)
      const statuses = [res1.status, res2.status].sort();
      assert(
        "Race condition: exactly one concurrent transaction succeeds, other fails with 409",
        statuses[0] === 200 && statuses[1] === 409,
        `Returned statuses: ${res1.status} and ${res2.status}`
      );

      // Cleanup invitation & member
      await prisma.invitation.delete({ where: { id: invitation.id } });
      try {
        await prisma.workspaceMember.delete({
          where: {
            workspaceId_userId: {
              workspaceId: workspace1.id,
              userId: userCorrect.id,
            },
          },
        });
      } catch {}
    }

  } catch (err) {
    console.error("Test execution failed with error:", err);
  } finally {
    console.log("Cleaning up static test fixtures...");

    // Delete Workspaces
    await prisma.workspace.delete({ where: { id: workspace1.id } });
    await prisma.workspace.delete({ where: { id: workspace2.id } });

    // Delete Users
    await prisma.user.delete({ where: { id: userCorrect.id } });
    await prisma.user.delete({ where: { id: userIncorrect.id } });

    console.log("Cleanup finished.");
  }

  // Restore original getSession method
  auth.api.getSession = originalGetSession;

  console.log(`=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
