import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { CreatePageSchema } from "@/lib/validations/page";

export async function GET() {
  const { workspace } = await requireWorkspace();
  const pages = await prisma.page.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { updatedAt: "desc" },
  });
  return apiSuccess(pages);
}

export async function POST(req: NextRequest) {
  const { workspace } = await requireWorkspace();
  const body = await req.json();
  const parsed = CreatePageSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_INPUT", parsed.error.issues[0].message);
  }

  const existing = await prisma.page.findUnique({
    where: {
      workspaceId_slug: {
        workspaceId: workspace.id,
        slug: parsed.data.slug,
      },
    },
  });
  if (existing) {
    return apiError("INVALID_INPUT", `Slug "${parsed.data.slug}" already in use.`);
  }

  const page = await prisma.page.create({
    data: { 
      workspaceId: workspace.id, 
      ...parsed.data,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      blocks: parsed.data.blocks as any 
    },
  });
  return apiSuccess(page);
}
