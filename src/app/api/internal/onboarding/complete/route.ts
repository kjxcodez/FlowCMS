import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { slugify } from "@/lib/utils";
import { generateApiKey, hashApiKey } from "@/lib/api-key";

/**
 * Onboarding Completion Endpoint
 * Provisions all necessary resources for a new workspace atomically and idempotently.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("UNAUTHORIZED", "Not logged in");

  const body = await req.json();
  const { workspaceName, firstSchemaName } = body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update user as onboarded
      await tx.user.update({
        where: { id: session.user.id },
        data: { onboarded: true }
      });

      // 2. Resolve Workspace (Find existing from registration or create if missing)
      let membership = await tx.workspaceMember.findFirst({
        where: { userId: session.user.id },
        include: { workspace: true }
      });

      let workspaceId: string;
      if (membership) {
        workspaceId = membership.workspaceId;
        // Update name if provided
        if (workspaceName && workspaceName !== membership.workspace.name) {
          await tx.workspace.update({
            where: { id: workspaceId },
            data: { name: workspaceName }
          });
        }
      } else {
        const name = workspaceName || "My Workspace";
        const workspace = await tx.workspace.create({
          data: {
            name,
            slug: slugify(name) + "-" + Math.random().toString(36).substring(7)
          }
        });
        workspaceId = workspace.id;
        await tx.workspaceMember.create({
          data: { userId: session.user.id, workspaceId, role: "OWNER" }
        });
      }

      // 3. Resolve Environment (Idempotent)
      let environment = await tx.environment.findFirst({
        where: { workspaceId, slug: "production" }
      });

      if (!environment) {
        environment = await tx.environment.create({
          data: {
            workspaceId,
            name: "Production",
            slug: "production",
            isDefault: true
          }
        });
      }

      // 4. Resolve API Key (Idempotent - Return existing or create new)
      let apiKeyRecord = await tx.apiKey.findFirst({
        where: { workspaceId, environmentId: environment.id, name: "Default Development Key" }
      });

      let rawKey: string | null = null;

      if (!apiKeyRecord) {
        const { raw, prefix } = generateApiKey();
        const keyHash = hashApiKey(raw);
        rawKey = raw;

        apiKeyRecord = await tx.apiKey.create({
          data: {
            workspaceId,
            environmentId: environment.id,
            name: "Default Development Key",
            keyHash,
            keyPrefix: prefix,
            scopes: ["read:collections", "read:entries"]
          }
        });
      }

      // 5. Resolve Starter Collection & Entry (Idempotent)
      if (firstSchemaName && firstSchemaName !== "Empty Vessel") {
        const collectionSlug = slugify(firstSchemaName);
        let collection = await tx.collection.findUnique({
          where: { workspaceId_slug: { workspaceId, slug: collectionSlug } }
        });

        if (!collection) {
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

          collection = await tx.collection.create({
            data: {
              workspaceId,
              name: firstSchemaName,
              slug: collectionSlug,
              mode: isVisual ? "VISUAL" : "STRUCTURED",
              fields: fields as any // eslint-disable-line @typescript-eslint/no-explicit-any
            }
          });

          // Create Starter Entry if collection was JUST created
          const entrySlug = "hello-world";
          const existingEntry = await tx.entry.findUnique({
            where: { collectionId_slug: { collectionId: collection.id, slug: entrySlug } }
          });

          if (!existingEntry) {
            const isVisualMode = collection.mode === "VISUAL";
            const entryData = isVisualMode 
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

            await tx.entry.create({
              data: {
                workspaceId,
                collectionId: collection.id,
                environmentId: environment.id,
                slug: entrySlug,
                data: entryData,
                status: "PUBLISHED"
              }
            });
          }
        }
      }

      return { rawKey, workspaceId };
    });

    // Return the raw API key ONLY if it was just created (activation speed)
    return apiSuccess({ 
      ok: true, 
      workspaceId: result.workspaceId,
      apiKey: result.rawKey 
    });

  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("Atomic onboarding failure:", err);
    return apiError("INTERNAL_ERROR", "Failed to complete onboarding. Please try again.");
  }
}
