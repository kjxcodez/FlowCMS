import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { checkContentTypeLimit } from "@/lib/usage";
import { apiError, apiSuccess } from "@/types/api";
import { logger } from "@/lib/logger";
import { CreateContentTypeSchema } from "@/lib/validations/content-type";

export const runtime = "nodejs";

export async function GET() {
  const { workspace } = await requireWorkspace();
  const types = await prisma.contentType.findMany({
    where: { workspaceId: workspace.id },
    include: { _count: { select: { entries: true } } },
    orderBy: { createdAt: "desc" },
  });
  return apiSuccess(types);
}

export async function POST(req: NextRequest) {
  const { workspace } = await requireWorkspace();

  const limit = await checkContentTypeLimit(
    workspace.id,
    workspace.plan
  );
  if (!limit.allowed) {
    return apiError(
      "PLAN_LIMIT_REACHED",
      `${workspace.plan} plan allows ${limit.limit} content types.`
    );
  }

  const body = await req.json();
  const parsed = CreateContentTypeSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_INPUT", parsed.error.issues[0].message);
  }

  const existing = await prisma.contentType.findUnique({
    where: {
      workspaceId_slug: {
        workspaceId: workspace.id,
        slug: parsed.data.slug,
      },
    },
  });
  if (existing) {
    return apiError(
      "INVALID_INPUT",
      `Slug "${parsed.data.slug}" already in use.`
    );
  }

  const contentType = await prisma.contentType.create({
    data: { workspaceId: workspace.id, ...parsed.data },
  });

  logger.info("Content type created", {
    workspaceId: workspace.id,
    slug: parsed.data.slug,
  });
  return apiSuccess(contentType);
}
