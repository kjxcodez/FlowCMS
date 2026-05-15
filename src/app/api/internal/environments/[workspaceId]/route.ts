import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspace } = await requireWorkspace();
  const { workspaceId } = await params;
  
  if (workspace.id !== workspaceId) {
    return apiError("FORBIDDEN", "Access denied");
  }

  const environments = await prisma.environment.findMany({
    where: { workspaceId },
    include: { _count: { select: { entries: true } } },
    orderBy: { createdAt: "asc" }
  });

  return apiSuccess(environments);
}
