import { NextRequest } from "next/server";
import { requireWorkspace, requireRole, ForbiddenError } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { dispatchWebhooks } from "@/lib/webhooks";
import { UpdateEntrySchema } from "@/lib/validations/entry";
import { purgeCacheTags } from "@/lib/cloudflare";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspace } = await requireWorkspace();
    const { id } = await params;

    const entry = await prisma.entry.findFirst({
      where: { id, collection: { workspaceId: workspace.id } },
      include: { collection: { select: { name: true, slug: true, fields: true } } },
    });
    if (!entry) return apiError("NOT_FOUND", "Entry not found.");
    return apiSuccess(entry);
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to fetch entry.");
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspace, role } = await requireWorkspace();
    await requireRole(role, "EDITOR");
    const { id } = await params;

    const body = await req.json();
    const parsed = UpdateEntrySchema.safeParse(body);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", parsed.error.issues[0].message);
    }

    const existing = await prisma.entry.findFirst({
      where: { id, collection: { workspaceId: workspace.id } },
    });
    if (!existing) return apiError("NOT_FOUND", "Entry not found.");

    // Check slug uniqueness if it's changing
    if (parsed.data.slug && parsed.data.slug !== existing.slug) {
      const slugConflict = await prisma.entry.findUnique({
        where: {
          collectionId_slug: {
            collectionId: existing.collectionId,
            slug: parsed.data.slug,
          },
        },
      });
      if (slugConflict) {
        return apiError("INVALID_INPUT", `Slug "${parsed.data.slug}" already exists in this collection.`);
      }
    }

    const isPublishing =
      parsed.data.status === "PUBLISHED" &&
      existing.status !== "PUBLISHED";

    // Double check that if the user attempts to publish via PATCH, they have ADMIN role
    if (isPublishing) {
      await requireRole(role, "ADMIN");
    }

    const entry = await prisma.entry.update({
      where: { id },
      data: {
        ...parsed.data,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: parsed.data.data ? (parsed.data.data as any) : undefined,
        publishedAt: isPublishing ? new Date() : undefined,
      },
    });

    if (isPublishing || parsed.data.status === "PUBLISHED") {
      purgeCacheTags([`ws:${workspace.id}`]).catch(() => {});
      dispatchWebhooks(workspace.id, "ENTRY_PUBLISHED", {
        entryId: entry.id,
      }).catch(() => {});
    } else {
      dispatchWebhooks(workspace.id, "ENTRY_UPDATED", {
        entryId: entry.id,
      }).catch(() => {});
    }

    return apiSuccess(entry);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    return apiError("INTERNAL_ERROR", "Failed to update entry.");
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

    const entry = await prisma.entry.findFirst({
      where: { id, collection: { workspaceId: workspace.id } },
    });
    if (!entry) return apiError("NOT_FOUND", "Entry not found.");

    await prisma.entry.delete({ where: { id } });

    purgeCacheTags([`ws:${workspace.id}`]).catch(() => {});
    dispatchWebhooks(workspace.id, "ENTRY_DELETED", {
      entryId: id,
    }).catch(() => {});

    return apiSuccess({ deleted: true });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    return apiError("INTERNAL_ERROR", "Failed to delete entry.");
  }
}
