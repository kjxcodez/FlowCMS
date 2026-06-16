import { POST as createCollection } from "../../../app/api/internal/collections/route";
import { PATCH as updateCollection, DELETE as deleteCollection } from "../../../app/api/internal/collections/[id]/route";
import { POST as applyTemplate } from "../../../app/api/internal/collections/apply-template/route";
import { NextRequest } from "next/server";
import { prisma } from "../../../lib/prisma";
import { setMockUser } from "../../run-rbac-tests";

export async function testCollections(ctx: {
  workspace: any;
  users: Record<string, any>;
  assert: (name: string, condition: boolean, message?: string) => void;
}) {
  const { workspace, users, assert } = ctx;
  const suffix = Math.random().toString(36).substring(7);

  // We will run tests for each role
  const roles = ["OWNER", "ADMIN", "EDITOR", "VIEWER"] as const;

  for (const role of roles) {
    setMockUser(users[role]);
    const isAllowed = role === "OWNER" || role === "ADMIN";

    // 1. Test Collection Creation
    {
      const slug = `col-${role.toLowerCase()}-${suffix}`;
      const req = new NextRequest(`http://localhost:3000/api/internal/collections`, {
        method: "POST",
        body: JSON.stringify({
          name: `Col ${role} ${suffix}`,
          slug,
          description: "Test collection",
          fields: [],
        }),
      });

      const res = await createCollection(req);
      if (isAllowed) {
        assert(`${role} is allowed to create collection`, res.status === 200, `Status: ${res.status}`);
      } else {
        assert(`${role} is blocked from creating collection`, res.status === 403, `Status: ${res.status}`);
      }
    }

    // 2. Test Apply Template
    {
      const req = new NextRequest(`http://localhost:3000/api/internal/collections/apply-template`, {
        method: "POST",
        body: JSON.stringify({
          templateId: "blog-post", // blog post template id
        }),
      });

      const res = await applyTemplate(req);
      if (isAllowed) {
        assert(`${role} is allowed to apply template`, res.status === 200, `Status: ${res.status}`);
      } else {
        assert(`${role} is blocked from applying template`, res.status === 403, `Status: ${res.status}`);
      }
    }
  }

  // Set up a collection specifically for update/delete tests
  const testCol = await prisma.collection.create({
    data: {
      workspaceId: workspace.id,
      name: `Col Test ${suffix}`,
      slug: `col-test-${suffix}`,
      fields: [],
    },
  });

  for (const role of roles) {
    setMockUser(users[role]);
    const isAllowed = role === "OWNER" || role === "ADMIN";

    // 3. Test Collection Update
    {
      const req = new NextRequest(`http://localhost:3000/api/internal/collections/${testCol.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: `Col Test Updated ${role} ${suffix}`,
        }),
      });

      const res = await updateCollection(req, { params: Promise.resolve({ id: testCol.id }) });
      if (isAllowed) {
        assert(`${role} is allowed to update collection`, res.status === 200, `Status: ${res.status}`);
      } else {
        assert(`${role} is blocked from updating collection`, res.status === 403, `Status: ${res.status}`);
      }
    }
  }

  // 4. Test Collection Delete
  for (const role of roles) {
    setMockUser(users[role]);
    const isAllowed = role === "OWNER" || role === "ADMIN";

    // Create a temporary collection to delete
    const tempCol = await prisma.collection.create({
      data: {
        workspaceId: workspace.id,
        name: `Col Temp ${role} ${suffix}`,
        slug: `col-temp-${role.toLowerCase()}-${suffix}`,
        fields: [],
      },
    });

    const req = new NextRequest(`http://localhost:3000/api/internal/collections/${tempCol.id}`, {
      method: "DELETE",
    });

    const res = await deleteCollection(req, { params: Promise.resolve({ id: tempCol.id }) });
    if (isAllowed) {
      assert(`${role} is allowed to delete collection`, res.status === 200, `Status: ${res.status}`);
    } else {
      assert(`${role} is blocked from delete collection`, res.status === 403, `Status: ${res.status}`);
      // Clean up manually if blocked
      await prisma.collection.delete({ where: { id: tempCol.id } });
    }
  }

  // Cleanup main test collection
  await prisma.collection.delete({ where: { id: testCol.id } }).catch(() => {});
}
