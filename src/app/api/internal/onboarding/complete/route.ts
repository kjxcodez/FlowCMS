import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("UNAUTHORIZED", "Not logged in");

  const body = await req.json();
  const { workspaceName, firstSchemaName } = body;

  try {
    // 1. Update user as onboarded
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboarded: true }
    });

    // 2. Find the user's workspace (created at registration)
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      include: { workspace: true }
    });

    if (membership) {
      // 3. Update workspace name if provided
      if (workspaceName) {
        await prisma.workspace.update({
          where: { id: membership.workspaceId },
          data: { 
            name: workspaceName,
            slug: slugify(workspaceName) + "-" + Math.random().toString(36).substring(7)
          }
        });
      }

      const workspaceId = membership.workspaceId;

      // 4. Create default Production environment
      let environmentId: string;
      const existingEnv = await prisma.environment.findFirst({
        where: { workspaceId, isDefault: true }
      });

      if (!existingEnv) {
        const env = await prisma.environment.create({
          data: {
            workspaceId,
            name: "Production",
            slug: "production",
            isDefault: true
          }
        });
        environmentId = env.id;
      } else {
        environmentId = existingEnv.id;
      }

      // 5. Create API Key
      await prisma.apiKey.create({
        data: {
          workspaceId,
          environmentId,
          name: "Default Development Key",
          key: `fl_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`,
          scopes: ["read:collections", "read:entries"]
        }
      });

      // 6. Create the first collection and entry if a template was selected
      if (firstSchemaName && firstSchemaName !== "Empty Vessel") {
        const isVisual = firstSchemaName === "Landing Page";
        const fields = firstSchemaName === "Blog Engine" 
          ? [
              { id: "1", name: "Title", slug: "title", type: "text", required: true },
              { id: "2", name: "Content", slug: "content", type: "richtext", required: true },
              { id: "3", name: "Cover Image", slug: "cover", type: "media" }
            ]
          : isVisual 
            ? [] 
            : [
                { id: "1", name: "Title", slug: "title", type: "text", required: true },
                { id: "2", name: "Body", slug: "body", type: "richtext" }
              ];

        const collection = await prisma.collection.create({
          data: {
            workspaceId,
            name: firstSchemaName,
            slug: slugify(firstSchemaName),
            mode: isVisual ? "VISUAL" : "STRUCTURED",
            fields: fields as any // eslint-disable-line @typescript-eslint/no-explicit-any
          }
        });

        // Create "Hello World" Entry
        const entryData = isVisual 
          ? { 
              title: "Welcome to FlowCMS",
              blocks: [
                { id: "b1", type: "heading", props: { text: "Hello World", level: 1 } },
                { id: "b2", type: "text", props: { text: "This is your first visual page powered by FlowCMS." } }
              ]
            }
          : {
              title: "Hello World",
              content: "Welcome to your new FlowCMS collection! This is a starter entry to help you see how the API works.",
              body: "Welcome to your new FlowCMS collection! This is a starter entry to help you see how the API works."
            };

        await prisma.entry.create({
          data: {
            collectionId: collection.id,
            environmentId,
            slug: "hello-world",
            data: entryData,
            status: "PUBLISHED"
          }
        });
      }
    } else {
      // No workspace found — create one now
      const name = workspaceName || "My Workspace";
      const workspace = await prisma.workspace.create({
        data: {
          name,
          slug: slugify(name) + "-" + Math.random().toString(36).substring(7)
        }
      });
      const workspaceId = workspace.id;
      await prisma.workspaceMember.create({
        data: { userId: session.user.id, workspaceId, role: "OWNER" }
      });

      // Create default Production environment
      const env = await prisma.environment.create({
        data: {
          workspaceId,
          name: "Production",
          slug: "production",
          isDefault: true
        }
      });

      // Create API Key
      await prisma.apiKey.create({
        data: {
          workspaceId,
          environmentId: env.id,
          name: "Default Development Key",
          key: `fl_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`,
          scopes: ["read:collections", "read:entries"]
        }
      });

      // Create the first collection if a template was selected
      if (firstSchemaName && firstSchemaName !== "Empty Vessel") {
        const isVisual = firstSchemaName === "Landing Page";
        const fields = firstSchemaName === "Blog Engine"
          ? [
              { id: "1", name: "Title", slug: "title", type: "text", required: true },
              { id: "2", name: "Content", slug: "content", type: "richtext", required: true },
              { id: "3", name: "Cover Image", slug: "cover", type: "media" }
            ]
          : isVisual
            ? []
            : [
                { id: "1", name: "Title", slug: "title", type: "text", required: true },
                { id: "2", name: "Body", slug: "body", type: "richtext" }
              ];

        const collection = await prisma.collection.create({
          data: {
            workspaceId,
            name: firstSchemaName,
            slug: slugify(firstSchemaName),
            mode: isVisual ? "VISUAL" : "STRUCTURED",
            fields: fields as any // eslint-disable-line @typescript-eslint/no-explicit-any
          }
        });

        // Create "Hello World" Entry
        const entryData = isVisual 
          ? { 
              title: "Welcome to FlowCMS",
              blocks: [
                { id: "b1", type: "heading", props: { text: "Hello World", level: 1 } },
                { id: "b2", type: "text", props: { text: "This is your first visual page powered by FlowCMS." } }
              ]
            }
          : {
              title: "Hello World",
              content: "Welcome to your new FlowCMS collection! This is a starter entry to help you see how the API works.",
              body: "Welcome to your new FlowCMS collection! This is a starter entry to help you see how the API works."
            };

        await prisma.entry.create({
          data: {
            collectionId: collection.id,
            environmentId: env.id,
            slug: "hello-world",
            data: entryData,
            status: "PUBLISHED"
          }
        });
      }
    }

    return apiSuccess({ ok: true });
  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("Onboarding error:", err);
    return apiError("INTERNAL_ERROR", err.message);
  }
}
