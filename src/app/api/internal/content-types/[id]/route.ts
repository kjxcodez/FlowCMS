import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { UpdateContentTypeSchema } from "@/lib/validations/content-type";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { workspace } = await requireWorkspace();
  const { id } = await params;

  const ct = await prisma.contentType.findFirst({
    where: { id, workspaceId: workspace.id },
    include: { _count: { select: { entries: true } } },
  });
  if (!ct) return apiError("NOT_FOUND", "Content type not found.");
  return apiSuccess(ct);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { workspace } = await requireWorkspace();
  const { id } = await params;

  const body = await req.json();
  const parsed = UpdateContentTypeSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_INPUT", parsed.error.issues[0].message);
  }

  const ct = await prisma.contentType.updateMany({
    where: { id, workspaceId: workspace.id },
    data: parsed.data,
  });
  if (!ct.count) return apiError("NOT_FOUND", "Content type not found.");

  const updated = await prisma.contentType.findUnique({ where: { id } });
  return apiSuccess(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { workspace } = await requireWorkspace();
  const { id } = await params;

  const ct = await prisma.contentType.deleteMany({
    where: { id, workspaceId: workspace.id },
  });
  if (!ct.count) return apiError("NOT_FOUND", "Content type not found.");
  return apiSuccess({ deleted: true });
}
