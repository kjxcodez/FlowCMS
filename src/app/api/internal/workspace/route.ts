import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/types/api";

export async function GET() {
  const { workspace } = await requireWorkspace();
  return apiSuccess({ name: workspace.name, plan: workspace.plan, slug: workspace.slug });
}

export async function PATCH(req: Request) {
  const { workspace } = await requireWorkspace();
  const { name } = await req.json();
  const updated = await prisma.workspace.update({
    where: { id: workspace.id },
    data: { name },
  });
  return apiSuccess({ name: updated.name, plan: updated.plan, slug: updated.slug });
}
