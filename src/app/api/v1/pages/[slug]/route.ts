import { withApiAuth } from "@/middleware/with-api-auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";

export const GET = withApiAuth(async (req, { workspaceId }) => {
  const slug = req.nextUrl.pathname.split("/").at(-1)!;

  const page = await prisma.page.findUnique({
    where: {
      workspaceId_slug: { workspaceId, slug },
    },
  });

  if (!page || page.status !== "PUBLISHED") {
    return apiError(
      "NOT_FOUND",
      `Page "${slug}" not found or not published.`
    );
  }

  return apiSuccess(page);
});
