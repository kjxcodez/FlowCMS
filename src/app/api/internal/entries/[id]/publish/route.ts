import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { dispatchWebhooks } from "@/lib/webhooks";
import { purgeCacheTags } from "@/lib/cloudflare";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { workspace } = await requireWorkspace();
  const { id } = await params;

  const entry = await prisma.entry.findFirst({
    where: { id, collection: { workspaceId: workspace.id } },
  });

  if (!entry) return apiError("NOT_FOUND", "Entry not found.");

  const updated = await prisma.entry.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      version: { increment: 1 },
    },
  });

  // Revalidate tags and purge cache
  purgeCacheTags([`ws:${workspace.id}`, `entry:${id}`]).catch(() => {});
  
  dispatchWebhooks(workspace.id, "ENTRY_PUBLISHED", {
    entryId: updated.id,
  }).catch(() => {});

  return apiSuccess(updated);
}
