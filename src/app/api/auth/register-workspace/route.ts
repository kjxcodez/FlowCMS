import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { slugify } from "@/lib/utils";
import { RegisterWorkspaceSchema } from "@/lib/validations/workspace";
import { getSession } from "@/lib/session";
import { generateApiKey, hashApiKey } from "@/lib/api-key";

/**
 * Register Workspace & Automate Onboarding
 * Provisions all starter resources (Environment, API Key, Blog/Pages collections, seed entries) atomically.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return apiError("UNAUTHORIZED", "Not logged in");
  }
  const userId = session.user.id;

  const body = await req.json();
  const parsed = RegisterWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_INPUT", parsed.error.issues[0].message);
  }

  const { title } = parsed.data;

  let slug = slugify(title);

  // Ensure unique slug
  const existing = await prisma.workspace.findUnique({
    where: { slug },
  });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Workspace
      const workspace = await tx.workspace.create({
        data: {
          name: title,
          slug,
          plan: "HOBBY",
          members: {
            create: { userId, role: "OWNER" },
          },
        },
      });

      // 2. Set onboarded = true for user
      await tx.user.update({
        where: { id: userId },
        data: { onboarded: true },
      });

      // 3. Create default Production environment
      const environment = await tx.environment.create({
        data: {
          workspaceId: workspace.id,
          name: "Production",
          slug: "production",
          isDefault: true,
        },
      });

      // 4. Generate default development API Key
      const { raw, prefix } = generateApiKey();
      const keyHash = hashApiKey(raw);

      await tx.apiKey.create({
        data: {
          workspaceId: workspace.id,
          environmentId: environment.id,
          name: "Default Development Key",
          keyHash,
          keyPrefix: prefix,
          scopes: ["read:collections", "read:entries", "read:media"],
        },
      });

      // 5. Create Blog collection
      const blogCollection = await tx.collection.create({
        data: {
          workspaceId: workspace.id,
          name: "Blog",
          slug: "blog",
          description: "Articles and posts for your blog.",
          mode: "STRUCTURED",
          fields: [
            { id: "1", name: "Title", slug: "title", type: "text", required: true },
            { id: "2", name: "Content", slug: "content", type: "richtext", required: true },
            { id: "3", name: "Cover Image", slug: "cover", type: "media", required: false },
          ] as any,
        },
      });

      // 6. Create Pages collection
      const pagesCollection = await tx.collection.create({
        data: {
          workspaceId: workspace.id,
          name: "Pages",
          slug: "pages",
          description: "Static web pages for your website.",
          mode: "STRUCTURED",
          fields: [
            { id: "1", name: "Title", slug: "title", type: "text", required: true },
            { id: "2", name: "Content", slug: "content", type: "richtext", required: true },
            { id: "3", name: "SEO Description", slug: "seo_description", type: "text", required: false },
          ] as any,
        },
      });

      // 7. Seed published Home entry in Pages
      await tx.entry.create({
        data: {
          workspaceId: workspace.id,
          collectionId: pagesCollection.id,
          environmentId: environment.id,
          slug: "home",
          status: "PUBLISHED",
          data: {
            title: "Home",
            content: "<p>Welcome to your home page! This content is managed through FlowCMS.</p>",
            seo_description: "The main landing page content for my website.",
          } as any,
        },
      });

      // 8. Seed published My First Post entry in Blog
      await tx.entry.create({
        data: {
          workspaceId: workspace.id,
          collectionId: blogCollection.id,
          environmentId: environment.id,
          slug: "my-first-post",
          status: "PUBLISHED",
          data: {
            title: "My First Post",
            content: "<p>This is my very first blog post managed via FlowCMS. Start customizing your schemas and entries to build your dream site!</p>",
            cover: null,
          } as any,
        },
      });

      return { workspaceId: workspace.id, rawKey: raw };
    });

    return apiSuccess({
      ok: true,
      workspaceId: result.workspaceId,
      apiKey: result.rawKey,
    });
  } catch (err: any) {
    console.error("Workspace registration and onboarding failure:", err);
    return apiError("INTERNAL_ERROR", "Failed to register workspace and provision resources.");
  }
}
