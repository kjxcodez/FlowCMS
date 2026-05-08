import { withApiAuth } from "@/middleware/with-api-auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/types/api";

export const GET = withApiAuth(async (req, { workspaceId }) => {
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "1");
  const perPage = Math.min(
    parseInt(searchParams.get("perPage") ?? "20"),
    100
  );

  const [media, total] = await Promise.all([
    prisma.media.findMany({
      where: { workspaceId },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: "desc" },
    }),
    prisma.media.count({ where: { workspaceId } }),
  ]);

  return apiSuccess(media, { total, page, perPage });
});
