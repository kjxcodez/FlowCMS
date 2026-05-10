import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { dispatchWebhooks } from "@/lib/webhooks";
import { UpdatePageSchema } from "@/lib/validations/page";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { workspace } = await requireWorkspace();
  const { id } = await params;
  const page = await prisma.page.findFirst({
    where: { id, workspaceId: workspace.id },
  });
  if (!page) return apiError("NOT_FOUND", "Page not found.");
  return apiSuccess(page);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { workspace } = await requireWorkspace();
  const { id } = await params;
  const body = await req.json();
  const parsed = UpdatePageSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_INPUT", parsed.error.issues[0].message);
  }

  const existing = await prisma.page.findFirst({
    where: { id, workspaceId: workspace.id },
  });
  if (!existing) return apiError("NOT_FOUND", "Page not found.");

  const isPublishing =
    parsed.data.status === "PUBLISHED" &&
    existing.status !== "PUBLISHED";

  const page = await prisma.page.update({
    where: { id },
    data: {
      ...parsed.data,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      blocks: parsed.data.blocks ? (parsed.data.blocks as any) : undefined,
      publishedAt: isPublishing ? new Date() : undefined,
    },
  });

  if (isPublishing) {
    dispatchWebhooks(workspace.id, "PAGE_PUBLISHED", {
      pageId: page.id,
    }).catch(() => {});
  }

  return apiSuccess(page);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { workspace } = await requireWorkspace();
  const { id } = await params;
  const page = await prisma.page.findFirst({
    where: { id, workspaceId: workspace.id },
  });
  if (!page) return apiError("NOT_FOUND", "Page not found.");
  await prisma.page.delete({ where: { id } });
  dispatchWebhooks(workspace.id, "PAGE_DELETED", { pageId: id }).catch(() => {});
  return apiSuccess({ deleted: true });
}
