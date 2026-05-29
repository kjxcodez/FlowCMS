import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { ApiKeyService } from "./api-key.service";
import { emitPlatformEvent, PLATFORM_EVENTS } from "../events/emitter";

export class WorkspaceService {
  /**
   * Retrieves active workspace details.
   */
  static async getWorkspace(id: string) {
    return await prisma.workspace.findUnique({
      where: { id },
      include: { razorpayCustomer: true },
    });
  }

  /**
   * Main Workspace Seeding & Provisioning Orchestrator (TASK-003)
   * Provisions workspaces, default environments, secure development API keys,
   * standard content schemas (Blog, Authors, Pages, Categories), and seeds initial entries.
   */
  static async provisionWorkspace(userId: string, workspaceName: string, _firstSchemaName?: string) {
    if (_firstSchemaName) {
      console.log(`Dynamic seeding request received for schema: ${_firstSchemaName}`);
    }
    const finalWorkspaceName = workspaceName?.trim() || "My Workspace";

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark user as onboarded
      await tx.user.update({
        where: { id: userId },
        data: { onboarded: true },
      });

      // 2. Resolve Workspace (or create if none exists)
      const membership = await tx.workspaceMember.findFirst({
        where: { userId },
        include: { workspace: true },
      });

      let workspaceId: string;
      let workspaceSlug: string;

      if (membership) {
        workspaceId = membership.workspaceId;
        workspaceSlug = membership.workspace.slug;
        if (finalWorkspaceName && finalWorkspaceName !== membership.workspace.name) {
          await tx.workspace.update({
            where: { id: workspaceId },
            data: { name: finalWorkspaceName },
          });
        }
      } else {
        workspaceSlug = `${slugify(finalWorkspaceName)}-${Math.random().toString(36).substring(7)}`;
        const workspace = await tx.workspace.create({
          data: {
            name: finalWorkspaceName,
            slug: workspaceSlug,
            plan: "HOBBY",
          },
        });
        workspaceId = workspace.id;
        await tx.workspaceMember.create({
          data: { userId, workspaceId, role: "OWNER" },
        });
      }

      // 3. Resolve Default Production Environment
      let environment = await tx.environment.findFirst({
        where: { workspaceId, slug: "production" },
      });

      if (!environment) {
        environment = await tx.environment.create({
          data: {
            workspaceId,
            name: "Production",
            slug: "production",
            isDefault: true,
          },
        });
      }

      // 4. Resolve Default Development API Key
      let apiKeyRecord = await tx.apiKey.findFirst({
        where: { workspaceId, environmentId: environment.id, name: "Default Development Key" },
      });

      let rawKey: string | null = null;

      if (!apiKeyRecord) {
        const { raw, prefix } = ApiKeyService.generateApiKey();
        const keyHash = ApiKeyService.hashApiKey(raw);
        rawKey = raw;

        apiKeyRecord = await tx.apiKey.create({
          data: {
            workspaceId,
            environmentId: environment.id,
            name: "Default Development Key",
            keyHash,
            keyPrefix: prefix,
            scopes: ["read:collections", "read:entries", "read:media"],
          },
        });
      }

      // 5. Build Canonical Starter Collections
      // A: Authors Collection
      const authorSlug = "authors";
      let authorCollection = await tx.collection.findUnique({
        where: { workspaceId_slug: { workspaceId, slug: authorSlug } },
      });

      if (!authorCollection) {
        authorCollection = await tx.collection.create({
          data: {
            workspaceId,
            name: "Authors",
            slug: authorSlug,
            description: "Profiles of publishers and content contributors.",
            mode: "STRUCTURED",
            fields: [
              { id: "a1", name: "Name", slug: "name", type: "text", required: true },
              { id: "a2", name: "Avatar URL", slug: "avatar", type: "media", required: false },
              { id: "a3", name: "Bio Text", slug: "bio", type: "richtext", required: false },
            ] as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          },
        });
      }

      // B: Categories Collection
      const categorySlug = "categories";
      let categoryCollection = await tx.collection.findUnique({
        where: { workspaceId_slug: { workspaceId, slug: categorySlug } },
      });

      if (!categoryCollection) {
        categoryCollection = await tx.collection.create({
          data: {
            workspaceId,
            name: "Categories",
            slug: categorySlug,
            description: "Topics and tags for entry taxomomy classifications.",
            mode: "STRUCTURED",
            fields: [
              { id: "c1", name: "Name", slug: "name", type: "text", required: true },
              { id: "c2", name: "Slug", slug: "slug", type: "text", required: true },
            ] as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          },
        });
      }

      // C: Blog Posts Collection
      const blogSlug = "blog-posts";
      let blogCollection = await tx.collection.findUnique({
        where: { workspaceId_slug: { workspaceId, slug: blogSlug } },
      });

      if (!blogCollection) {
        blogCollection = await tx.collection.create({
          data: {
            workspaceId,
            name: "Blog Posts",
            slug: blogSlug,
            description: "Articles, announcements, and structured press logs.",
            mode: "STRUCTURED",
            fields: [
              { id: "b1", name: "Title", slug: "title", type: "text", required: true },
              { id: "b2", name: "Slug", slug: "slug", type: "text", required: true },
              { id: "b3", name: "Excerpt", slug: "excerpt", type: "text", required: false },
              { id: "b4", name: "Content Body", slug: "content", type: "richtext", required: true },
              { id: "b5", name: "Cover Image", slug: "cover", type: "media", required: false },
              { id: "b6", name: "Author Ref", slug: "author", type: "reference", required: false },
              { id: "b7", name: "Category Ref", slug: "category", type: "reference", required: false },
              { id: "b8", name: "Published Date", slug: "published_at", type: "date", required: false },
              { id: "b9", name: "SEO Title", slug: "seo_title", type: "text", required: false },
              { id: "b10", name: "SEO Description", slug: "seo_description", type: "text", required: false },
            ] as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          },
        });
      }

      // D: Pages Collection (Visual Layout Mode)
      const pagesSlug = "pages";
      let pagesCollection = await tx.collection.findUnique({
        where: { workspaceId_slug: { workspaceId, slug: pagesSlug } },
      });

      if (!pagesCollection) {
        pagesCollection = await tx.collection.create({
          data: {
            workspaceId,
            name: "Pages",
            slug: pagesSlug,
            description: "Dynamic web pages powered by the visual visual editor.",
            mode: "VISUAL",
            fields: [] as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          },
        });
      }

      // 6. Seed Dynamic Entries (Prevent Empty State Syndrome)
      // Seed Author
      const seedAuthorSlug = "jane-smith";
      let authorEntry = await tx.entry.findUnique({
        where: { collectionId_slug: { collectionId: authorCollection.id, slug: seedAuthorSlug } },
      });

      if (!authorEntry) {
        authorEntry = await tx.entry.create({
          data: {
            workspaceId,
            collectionId: authorCollection.id,
            environmentId: environment.id,
            slug: seedAuthorSlug,
            status: "PUBLISHED",
            data: {
              name: "Jane Smith",
              avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
              bio: "<p>Jane is an lead content architect at FlowCMS with a focus on editorial systems engineering.</p>",
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          },
        });
      }

      // Seed Category
      const seedCategorySlug = "technology";
      let categoryEntry = await tx.entry.findUnique({
        where: { collectionId_slug: { collectionId: categoryCollection.id, slug: seedCategorySlug } },
      });

      if (!categoryEntry) {
        categoryEntry = await tx.entry.create({
          data: {
            workspaceId,
            collectionId: categoryCollection.id,
            environmentId: environment.id,
            slug: seedCategorySlug,
            status: "PUBLISHED",
            data: {
              name: "Technology",
              slug: "technology",
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          },
        });
      }

      // Seed Blog Post
      const seedBlogPostSlug = "welcome-to-flowcms";
      let blogEntry = await tx.entry.findUnique({
        where: { collectionId_slug: { collectionId: blogCollection.id, slug: seedBlogPostSlug } },
      });

      if (!blogEntry) {
        blogEntry = await tx.entry.create({
          data: {
            workspaceId,
            collectionId: blogCollection.id,
            environmentId: environment.id,
            slug: seedBlogPostSlug,
            status: "PUBLISHED",
            data: {
              title: "Welcome to FlowCMS",
              slug: seedBlogPostSlug,
              excerpt: "FlowCMS bridges the editor's editorial craft with advanced engineering.",
              content: "<p>Welcome to your new headless CMS dashboard! This entry is fully wired and ready to be fetched via our cURL or fetch guidelines. Start customizing your block designs to get your platform rolling.</p>",
              cover: "https://images.unsplash.com/photo-1542435503-956c469947f6?w=800",
              author: authorEntry.id, // Direct reference linked
              category: categoryEntry.id, // Taxomomy reference linked
              published_at: new Date().toISOString().split("T")[0],
              seo_title: "Getting Started with FlowCMS",
              seo_description: "Learn how content modeling can be done instantly with FlowCMS.",
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          },
        });
      }

      // Seed Visual Page (Pages)
      const seedPageSlug = "home";
      let pageEntry = await tx.entry.findUnique({
        where: { collectionId_slug: { collectionId: pagesCollection.id, slug: seedPageSlug } },
      });

      if (!pageEntry) {
        pageEntry = await tx.entry.create({
          data: {
            workspaceId,
            collectionId: pagesCollection.id,
            environmentId: environment.id,
            slug: seedPageSlug,
            status: "PUBLISHED",
            data: {
              title: "Home",
              blocks: [
                { id: "b1", type: "heading", props: { text: "Visual Content, Structured for Builders", level: 1 } },
                { id: "b2", type: "text", props: { text: "This visual block page is served instantly from the FlowCMS edge cache network." } },
              ],
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          },
        });
      }

      return { rawKey, workspaceId, workspaceSlug };
    });

    emitPlatformEvent(PLATFORM_EVENTS.WORKSPACE_PROVISIONED, {
      userId,
      workspaceId: result.workspaceId,
      slug: result.workspaceSlug,
    });

    return {
      workspaceId: result.workspaceId,
      slug: result.workspaceSlug,
      apiKey: result.rawKey,
    };
  }
}
