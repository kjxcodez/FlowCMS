import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { CreateEntrySchema } from "@/lib/validations/entry";
import { dispatchWebhooks } from "@/lib/webhooks";

export async function GET(req: NextRequest) {
  const { workspace } = await requireWorkspace();
  const { searchParams } = req.nextUrl;

  const contentTypeId = searchParams.get("contentTypeId");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1");
  const perPage = Math.min(
    parseInt(searchParams.get("perPage") ?? "20"),
    100
  );

  const where = {
    ...(contentTypeId ? { contentTypeId } : {}),
    ...(status ? { status: status as never } : {}),
    contentType: { workspaceId: workspace.id },
  };

  const [entries, total] = await Promise.all([
    prisma.entry.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { updatedAt: "desc" },
      include: { contentType: { select: { name: true, slug: true } } },
    }),
    prisma.entry.count({ where }),
  ]);

  return apiSuccess(entries, { total, page, perPage });
}

export async function POST(req: NextRequest) {
  const { workspace } = await requireWorkspace();
  const body = await req.json();
  const parsed = CreateEntrySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_INPUT", parsed.error.issues[0].message);
  }

  // Verify content type belongs to workspace
  const ct = await prisma.contentType.findFirst({
    where: {
      id: parsed.data.contentTypeId,
      workspaceId: workspace.id,
    },
  });
  if (!ct) return apiError("NOT_FOUND", "Content type not found.");

  const entry = await prisma.entry.create({
    data: {
      contentTypeId: parsed.data.contentTypeId,
      workspaceId: workspace.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: parsed.data.data as any,
      status: parsed.data.status ?? "DRAFT",
      publishedAt:
        parsed.data.status === "PUBLISHED" ? new Date() : null,
    },
  });

  // Dispatch Webhooks
  const event = entry.status === "PUBLISHED" ? "ENTRY_PUBLISHED" : "ENTRY_CREATED";
  dispatchWebhooks(workspace.id, event, entry);

  return apiSuccess(entry);
}
