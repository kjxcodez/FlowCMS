import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { CreateEntrySchema } from "@/lib/validations/entry";
import { dispatchWebhooks } from "@/lib/webhooks";
import { EntryStatus, Prisma } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  const { workspace } = await requireWorkspace();
  const { searchParams } = req.nextUrl;

  const collectionId = searchParams.get("collectionId");
  const statusParam = searchParams.get("status");
  const status = statusParam && Object.values(EntryStatus).includes(statusParam as EntryStatus)
    ? (statusParam as EntryStatus)
    : undefined;

  const page = parseInt(searchParams.get("page") ?? "1");
  const perPage = Math.min(
    parseInt(searchParams.get("perPage") ?? "20"),
    100
  );

  const where = {
    ...(collectionId ? { collectionId } : {}),
    ...(status ? { status } : {}),
    collection: { workspaceId: workspace.id },
  };

  const [entries, total] = await Promise.all([
    prisma.entry.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { updatedAt: "desc" },
      include: { collection: { select: { name: true, slug: true } } },
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

  // Verify collection belongs to workspace
  const collection = await prisma.collection.findFirst({
    where: {
      id: parsed.data.collectionId,
      workspaceId: workspace.id,
    },
  });
  if (!collection) return apiError("NOT_FOUND", "Collection not found.");

  // Check slug uniqueness within collection
  const existing = await prisma.entry.findUnique({
    where: {
      collectionId_slug: {
        collectionId: parsed.data.collectionId,
        slug: parsed.data.slug,
      },
    },
  });
  if (existing) {
    return apiError("INVALID_INPUT", `Slug "${parsed.data.slug}" already exists in this collection.`);
  }

  const entry = await prisma.entry.create({
    data: {
      collectionId: parsed.data.collectionId,
      workspaceId: workspace.id,
      slug: parsed.data.slug,
      data: parsed.data.data as Prisma.InputJsonValue,
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
