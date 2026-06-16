import { POST as createEntry } from "../../../app/api/internal/entries/route";
import { PATCH as updateEntry, DELETE as deleteEntry } from "../../../app/api/internal/entries/[id]/route";
import { PATCH as publishEntry } from "../../../app/api/internal/entries/[id]/publish/route";
import { NextRequest } from "next/server";
import { prisma } from "../../../lib/prisma";
import { setMockUser } from "../../run-rbac-tests";

export async function testEntries(ctx: {
  workspace: any;
  users: Record<string, any>;
  assert: (name: string, condition: boolean, message?: string) => void;
}) {
  const { workspace, users, assert } = ctx;
  const suffix = Math.random().toString(36).substring(7);

  // Set up a test collection for entries
  const collection = await prisma.collection.create({
    data: {
      workspaceId: workspace.id,
      name: `Entries Test Col ${suffix}`,
      slug: `entries-test-col-${suffix}`,
      fields: [],
    },
  });

  const roles = ["OWNER", "ADMIN", "EDITOR", "VIEWER"] as const;

  // 1. Test Entry Creation (Draft)
  for (const role of roles) {
    setMockUser(users[role]);
    const isAllowed = role === "OWNER" || role === "ADMIN" || role === "EDITOR";
    const slug = `entry-${role.toLowerCase()}-${suffix}`;

    const req = new NextRequest(`http://localhost:3000/api/internal/entries`, {
      method: "POST",
      body: JSON.stringify({
        collectionId: collection.id,
        slug,
        data: { title: `Entry ${role} ${suffix}` },
        status: "DRAFT",
      }),
    });

    const res = await createEntry(req);
    if (isAllowed) {
      assert(`${role} is allowed to create entry draft`, res.status === 200, `Status: ${res.status}`);
    } else {
      assert(`${role} is blocked from creating entry draft`, res.status === 403, `Status: ${res.status}`);
    }
  }

  // Set up a base draft entry for edit/publish/delete tests
  const testEntry = await prisma.entry.create({
    data: {
      collectionId: collection.id,
      workspaceId: workspace.id,
      slug: `test-entry-${suffix}`,
      data: { title: "Original Title" },
      status: "DRAFT",
    },
  });

  // 2. Test Entry Update (Draft)
  for (const role of roles) {
    setMockUser(users[role]);
    const isAllowed = role === "OWNER" || role === "ADMIN" || role === "EDITOR";

    const req = new NextRequest(`http://localhost:3000/api/internal/entries/${testEntry.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        data: { title: `Updated Title by ${role}` },
      }),
    });

    const res = await updateEntry(req, { params: Promise.resolve({ id: testEntry.id }) });
    if (isAllowed) {
      assert(`${role} is allowed to update entry draft`, res.status === 200, `Status: ${res.status}`);
    } else {
      assert(`${role} is blocked from updating entry draft`, res.status === 403, `Status: ${res.status}`);
    }
  }

  // 3. Test Entry Update with Status Change to PUBLISHED (via PATCH)
  for (const role of roles) {
    setMockUser(users[role]);
    const isAllowed = role === "OWNER" || role === "ADMIN"; // Editors cannot publish!

    const req = new NextRequest(`http://localhost:3000/api/internal/entries/${testEntry.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "PUBLISHED",
      }),
    });

    const res = await updateEntry(req, { params: Promise.resolve({ id: testEntry.id }) });
    if (isAllowed) {
      assert(`${role} is allowed to publish entry via PATCH status update`, res.status === 200, `Status: ${res.status}`);
      // Revert back to DRAFT for next tests
      await prisma.entry.update({
        where: { id: testEntry.id },
        data: { status: "DRAFT" },
      });
    } else {
      assert(`${role} is blocked from publishing entry via PATCH status update`, res.status === 403, `Status: ${res.status}`);
    }
  }

  // 4. Test Entry Publishing (via /publish endpoint)
  for (const role of roles) {
    setMockUser(users[role]);
    const isAllowed = role === "OWNER" || role === "ADMIN"; // Editors cannot publish!

    const req = new NextRequest(`http://localhost:3000/api/internal/entries/${testEntry.id}/publish`, {
      method: "PATCH",
    });

    const res = await publishEntry(req, { params: Promise.resolve({ id: testEntry.id }) });
    if (isAllowed) {
      assert(`${role} is allowed to publish entry via /publish endpoint`, res.status === 200, `Status: ${res.status}`);
      // Revert back to DRAFT for next tests
      await prisma.entry.update({
        where: { id: testEntry.id },
        data: { status: "DRAFT" },
      });
    } else {
      assert(`${role} is blocked from publishing entry via /publish endpoint`, res.status === 403, `Status: ${res.status}`);
    }
  }

  // 5. Test Entry Delete
  for (const role of roles) {
    setMockUser(users[role]);
    const isAllowed = role === "OWNER" || role === "ADMIN"; // Editors cannot delete!

    // Create a temporary entry to delete
    const tempEntry = await prisma.entry.create({
      data: {
        collectionId: collection.id,
        workspaceId: workspace.id,
        slug: `temp-entry-${role.toLowerCase()}-${suffix}`,
        data: { title: "Temp Entry" },
        status: "DRAFT",
      },
    });

    const req = new NextRequest(`http://localhost:3000/api/internal/entries/${tempEntry.id}`, {
      method: "DELETE",
    });

    const res = await deleteEntry(req, { params: Promise.resolve({ id: tempEntry.id }) });
    if (isAllowed) {
      assert(`${role} is allowed to delete entry`, res.status === 200, `Status: ${res.status}`);
    } else {
      assert(`${role} is blocked from deleting entry`, res.status === 403, `Status: ${res.status}`);
      // Clean up manually if blocked
      await prisma.entry.delete({ where: { id: tempEntry.id } });
    }
  }

  // Cleanup main test entry & collection
  await prisma.entry.delete({ where: { id: testEntry.id } }).catch(() => {});
  await prisma.collection.delete({ where: { id: collection.id } }).catch(() => {});
}
