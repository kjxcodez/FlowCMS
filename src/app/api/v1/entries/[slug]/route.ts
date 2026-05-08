import { withApiAuth } from "@/middleware/with-api-auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";

export const runtime = "nodejs";

export const GET = withApiAuth(async (req, { workspaceId }) => {
  const slug = req.nextUrl.pathname.split("/").at(-1)!;
  const { searchParams } = req.nextUrl;

  const status = searchParams.get("status") ?? "published";
  const page = parseInt(searchParams.get("page") ?? "1");
  const perPage = Math.min(
    parseInt(searchParams.get("perPage") ?? "20"),
    100
  );

  const contentType = await prisma.contentType.findUnique({
    where: { workspaceId_slug: { workspaceId, slug } },
  });

  if (!contentType) {
    return apiError("NOT_FOUND", `Content type "${slug}" not found.`);
  }

  const where = {
    contentTypeId: contentType.id,
    ...(status !== "all"
      ? { status: status.toUpperCase() as never }
      : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.entry.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.entry.count({ where }),
  ]);

  return apiSuccess(entries, { total, page, perPage });
});
