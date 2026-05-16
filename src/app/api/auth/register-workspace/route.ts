import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { slugify } from "@/lib/utils";
import { RegisterWorkspaceSchema } from "@/lib/validations/workspace";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = RegisterWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_INPUT", parsed.error.issues[0].message);
  }

  const { title, userId } = body; // Frontend sends 'title'
  if (!title || !userId) {
    return apiError("INVALID_INPUT", "Missing title or userId");
  }

  let slug = slugify(title);

  // Ensure unique slug
  const existing = await prisma.workspace.findUnique({
    where: { slug },
  });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: title,
      slug,
      plan: "HOBBY",
      members: {
        create: { userId, role: "OWNER" },
      },
    },
  });

  // AHA MOMENT: Create Starter Collection
  const collection = await prisma.collection.create({
    data: {
      workspaceId: workspace.id,
      name: "Pages",
      slug: "pages",
      description: "Static pages for your website.",
      fields: [
        { name: "Title", slug: "title", type: "text", required: true },
        { name: "Content", slug: "content", type: "richtext", required: true },
        { name: "SEO Description", slug: "seo_description", type: "text", required: false },
      ] as any,
    },
  });

  // Create Starter Entry
  await prisma.entry.create({
    data: {
      workspaceId: workspace.id,
      collectionId: collection.id,
      slug: "hello-world",
      status: "DRAFT",
      data: {
        title: "Hello World from FlowCMS",
        content: "<p>Welcome to your new headless CMS. This is a starter entry to help you see how the API works.</p>",
        seo_description: "My first page created with FlowCMS."
      } as any,
    },
  });

  return apiSuccess({ ok: true });
}
