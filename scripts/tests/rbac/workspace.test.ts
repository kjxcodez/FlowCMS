import { GET as getWorkspace, PATCH as updateWorkspace, DELETE as deleteWorkspace } from "../../../src/app/api/internal/workspace/route";
import { POST as checkoutSession } from "../../../src/app/api/billing/checkout/route";
import { DELETE as removeMember } from "../../../src/app/api/internal/members/[userId]/route";
import { GET as getInvitations, POST as createInvitation } from "../../../src/app/api/internal/workspace/invitations/route";
import { DELETE as deleteInvitation } from "../../../src/app/api/internal/workspace/invitations/[id]/route";
import { NextRequest } from "next/server";
import { prisma } from "../../../src/lib/prisma";
import { setMockUser } from "../../run-rbac-tests";
import { FEATURES } from "../../../src/lib/launch";

export async function testWorkspace(ctx: {
  workspace: any;
  users: Record<string, any>;
  assert: (name: string, condition: boolean, message?: string) => void;
}) {
  const { workspace, users, assert } = ctx;
  const suffix = Math.random().toString(36).substring(7);

  // Enable team invites feature during the test
  const originalEnableTeamInvites = FEATURES.enableTeamInvites;
  FEATURES.enableTeamInvites = true;

  const roles = ["OWNER", "ADMIN", "EDITOR", "VIEWER"] as const;

  // 1. Test GET Workspace Info
  // Allowed for: OWNER, ADMIN, EDITOR, VIEWER
  for (const role of roles) {
    setMockUser(users[role]);
    const res = await getWorkspace();
    assert(`${role} is allowed to view workspace info`, res.status === 200, `Status: ${res.status}`);
  }

  // 2. Test PATCH Workspace Settings (Update name)
  // Allowed for: OWNER, ADMIN
  for (const role of roles) {
    setMockUser(users[role]);
    const isAllowed = role === "OWNER" || role === "ADMIN";

    const req = new NextRequest(`http://localhost:3000/api/internal/workspace`, {
      method: "PATCH",
      body: JSON.stringify({
        name: `Workspace Named by ${role} ${suffix}`,
      }),
    });

    const res = await updateWorkspace(req);
    if (isAllowed) {
      assert(`${role} is allowed to update workspace settings`, res.status === 200, `Status: ${res.status}`);
    } else {
      assert(`${role} is blocked from updating workspace settings`, res.status === 403, `Status: ${res.status}`);
    }
  }

  // 3. Test Billing Checkout POST
  // Allowed for: OWNER
  for (const role of roles) {
    setMockUser(users[role]);
    const isAllowed = role === "OWNER";

    const req = new NextRequest(`http://localhost:3000/api/billing/checkout`, {
      method: "POST",
      body: JSON.stringify({
        planKey: "INVALID_PLAN_KEY_FOR_TESTING",
      }),
    });

    const res = await checkoutSession(req);
    if (isAllowed) {
      // 400 (Invalid plan) indicates it bypassed the role check and failed at plan validation
      assert(`${role} passed role check for billing checkout`, res.status === 400, `Status: ${res.status}`);
    } else {
      assert(`${role} is blocked from billing checkout`, res.status === 403, `Status: ${res.status}`);
    }
  }

  // 4. Test Invitations CRUD
  // Allowed for: OWNER, ADMIN
  for (const role of roles) {
    setMockUser(users[role]);
    const isAllowed = role === "OWNER" || role === "ADMIN";

    // GET invitations list
    {
      const res = await getInvitations();
      if (isAllowed) {
        assert(`${role} is allowed to view invitations`, res.status === 200, `Status: ${res.status}`);
      } else {
        assert(`${role} is blocked from viewing invitations`, res.status === 403, `Status: ${res.status}`);
      }
    }

    // POST invitation
    {
      const req = new NextRequest(`http://localhost:3000/api/internal/workspace/invitations`, {
        method: "POST",
        body: JSON.stringify({
          email: `invite-${role.toLowerCase()}-${suffix}@example.com`,
          role: "EDITOR",
        }),
      });

      const res = await createInvitation(req);
      if (isAllowed) {
        assert(`${role} is allowed to create invitation`, res.status === 200, `Status: ${res.status}`);
        if (res.status === 200) {
          const body = await res.json();
          await prisma.invitation.delete({ where: { id: body.data.id } }).catch(() => {});
        }
      } else {
        assert(`${role} is blocked from creating invitation`, res.status === 403, `Status: ${res.status}`);
      }
    }
  }

  // Set up static invitation for delete test
  const testInvite = await prisma.invitation.create({
    data: {
      workspaceId: workspace.id,
      email: `test-invite-del-${suffix}@example.com`,
      role: "EDITOR",
      token: `token-del-${suffix}`,
      invitedById: users.OWNER.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  // DELETE invitation
  for (const role of roles) {
    setMockUser(users[role]);
    const isAllowed = role === "OWNER" || role === "ADMIN";

    const tempInvite = await prisma.invitation.create({
      data: {
        workspaceId: workspace.id,
        email: `temp-invite-del-${role.toLowerCase()}-${suffix}@example.com`,
        role: "EDITOR",
        token: `token-temp-del-${role.toLowerCase()}-${suffix}`,
        invitedById: users.OWNER.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const req = new NextRequest(`http://localhost:3000/api/internal/workspace/invitations/${tempInvite.id}`, {
      method: "DELETE",
    });

    const res = await deleteInvitation(req, { params: Promise.resolve({ id: tempInvite.id }) });
    if (isAllowed) {
      assert(`${role} is allowed to delete invitation`, res.status === 200, `Status: ${res.status}`);
    } else {
      assert(`${role} is blocked from deleting invitation`, res.status === 403, `Status: ${res.status}`);
      await prisma.invitation.delete({ where: { id: tempInvite.id } }).catch(() => {});
    }
  }

  await prisma.invitation.delete({ where: { id: testInvite.id } }).catch(() => {});

  // 5. Test Member Deletion (DELETE /api/internal/members/[userId])
  // Allowed for: OWNER
  for (const role of roles) {
    setMockUser(users[role]);
    const isAllowed = role === "OWNER";

    // Create a temporary user to be removed
    const tempUser = await prisma.user.create({
      data: {
        email: `temp-member-${role.toLowerCase()}-${suffix}@example.com`,
        name: `Temp Member ${role}`,
        onboarded: true,
        emailVerified: true,
      },
    });

    const tempMember = await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: tempUser.id,
        role: "EDITOR",
      },
    });

    const req = new NextRequest(`http://localhost:3000/api/internal/members/${tempUser.id}`, {
      method: "DELETE",
    });

    const res = await removeMember(req, { params: Promise.resolve({ userId: tempUser.id }) });
    if (isAllowed) {
      assert(`${role} is allowed to remove workspace member`, res.status === 200, `Status: ${res.status}`);
    } else {
      assert(`${role} is blocked from removing workspace member`, res.status === 403, `Status: ${res.status}`);
      // Clean up manually if blocked
      await prisma.workspaceMember.delete({
        where: {
          workspaceId_userId: {
            workspaceId: workspace.id,
            userId: tempUser.id,
          },
        },
      }).catch(() => {});
    }

    // Clean up user
    await prisma.user.delete({ where: { id: tempUser.id } }).catch(() => {});
  }

  // 6. Test Workspace Deletion (DELETE /api/internal/workspace)
  // Allowed for: OWNER
  // For other roles, assert they are blocked.
  for (const role of roles) {
    if (role === "OWNER") continue; // We test OWNER last, or on a temp workspace
    setMockUser(users[role]);

    const req = new NextRequest(`http://localhost:3000/api/internal/workspace`, {
      method: "DELETE",
    });

    const res = await deleteWorkspace();
    assert(`${role} is blocked from deleting workspace`, res.status === 403, `Status: ${res.status}`);
  }

  // Test OWNER workspace deletion on a temporary workspace
  {
    // Create a temporary workspace and set up OWNER role
    const tempWorkspace = await prisma.workspace.create({
      data: {
        name: `Temp Workspace to Delete ${suffix}`,
        slug: `temp-ws-del-${suffix}`,
      },
    });

    const tempOwner = await prisma.user.create({
      data: {
        email: `temp-owner-del-${suffix}@example.com`,
        name: "Temp Owner",
        onboarded: true,
        emailVerified: true,
      },
    });

    await prisma.workspaceMember.create({
      data: {
        workspaceId: tempWorkspace.id,
        userId: tempOwner.id,
        role: "OWNER",
      },
    });

    // Mock session user to tempOwner
    setMockUser(tempOwner);

    const res = await deleteWorkspace();
    assert(`OWNER is allowed to delete workspace`, res.status === 200, `Status: ${res.status}`);

    // Verify workspace is actually deleted
    const checkWs = await prisma.workspace.findUnique({ where: { id: tempWorkspace.id } });
    assert(`Workspace is deleted from database`, checkWs === null);

    // Clean up tempOwner
    await prisma.user.delete({ where: { id: tempOwner.id } }).catch(() => {});
  }

  // Restore features
  FEATURES.enableTeamInvites = originalEnableTeamInvites;
}
