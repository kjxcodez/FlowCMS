import { NextRequest } from "next/server";
import { requireWorkspace, requireRole, ForbiddenError } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { UpdateCollectionSchema } from "@/lib/validations/collection";
import { dispatchWebhooks } from "@/lib/webhooks";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { workspace } = await requireWorkspace();
  const { id } = await params;

  const collection = await prisma.collection.findFirst({
    where: { id, workspaceId: workspace.id },
    include: { _count: { select: { entries: true } } },
  });
  if (!collection) return apiError("NOT_FOUND", "Collection not found.");
  return apiSuccess(collection);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspace, role } = await requireWorkspace();
    await requireRole(role, "ADMIN");
    const { id } = await params;

    const body = await req.json();
    const parsed = UpdateCollectionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", parsed.error.issues[0].message);
    }

    const result = await prisma.collection.updateMany({
      where: { id, workspaceId: workspace.id },
      data: parsed.data,
    });
    if (!result.count) return apiError("NOT_FOUND", "Collection not found.");

    const updated = await prisma.collection.findUnique({ where: { id } });
    
    if (updated) {
      dispatchWebhooks(workspace.id, "COLLECTION_UPDATED", updated);
    }

    return apiSuccess(updated);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    return apiError("INTERNAL_ERROR", "Failed to update collection.");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspace, role } = await requireWorkspace();
    await requireRole(role, "ADMIN");
    const { id } = await params;

    const collection = await prisma.collection.findFirst({
      where: { id, workspaceId: workspace.id },
    });
    if (!collection) return apiError("NOT_FOUND", "Collection not found.");

    await prisma.collection.delete({
      where: { id },
    });

    dispatchWebhooks(workspace.id, "COLLECTION_DELETED", collection);

    return apiSuccess({ deleted: true });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    return apiError("INTERNAL_ERROR", "Failed to delete collection.");
  }
}
