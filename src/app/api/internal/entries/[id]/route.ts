import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { fireWebhooks } from "@/lib/webhooks";
import { UpdateEntrySchema } from "@/lib/validations/entry";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { workspace } = await requireWorkspace();
  const { id } = await params;

  const entry = await prisma.entry.findFirst({
    where: { id, contentType: { workspaceId: workspace.id } },
    include: { contentType: { select: { name: true, slug: true, fields: true } } },
  });
  if (!entry) return apiError("NOT_FOUND", "Entry not found.");
  return apiSuccess(entry);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { workspace } = await requireWorkspace();
  const { id } = await params;

  const body = await req.json();
  const parsed = UpdateEntrySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_INPUT", parsed.error.issues[0].message);
  }

  const existing = await prisma.entry.findFirst({
    where: { id, contentType: { workspaceId: workspace.id } },
  });
  if (!existing) return apiError("NOT_FOUND", "Entry not found.");

  const isPublishing =
    parsed.data.status === "PUBLISHED" &&
    existing.status !== "PUBLISHED";

  const entry = await prisma.entry.update({
    where: { id },
    data: {
      ...parsed.data,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: parsed.data.data ? (parsed.data.data as any) : undefined,
      publishedAt: isPublishing ? new Date() : undefined,
    },
  });

  if (isPublishing) {
    fireWebhooks(workspace.id, "ENTRY_PUBLISHED", {
      entryId: entry.id,
    }).catch(() => {});
  }

  return apiSuccess(entry);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { workspace } = await requireWorkspace();
  const { id } = await params;

  const entry = await prisma.entry.findFirst({
    where: { id, contentType: { workspaceId: workspace.id } },
  });
  if (!entry) return apiError("NOT_FOUND", "Entry not found.");

  await prisma.entry.delete({ where: { id } });

  fireWebhooks(workspace.id, "ENTRY_DELETED", {
    entryId: id,
  }).catch(() => {});

  return apiSuccess({ deleted: true });
}
