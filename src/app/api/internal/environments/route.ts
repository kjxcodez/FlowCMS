import { NextRequest } from "next/server";
import { requireWorkspace, requireRole, ForbiddenError } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { slugify } from "@/lib/utils";
import { checkEnvironmentLimit } from "@/lib/usage";
import { isAdminEmail } from "@/lib/admin";

export async function GET() {
  try {
    const { workspace } = await requireWorkspace();
    const environments = await prisma.environment.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "asc" }
    });
    return apiSuccess(environments);
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to fetch environments.");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workspace, session, role } = await requireWorkspace();
    await requireRole(role, "ADMIN");

    const limit = await checkEnvironmentLimit(
      workspace.id,
      workspace.plan,
      isAdminEmail(session.user.email)
    );
    if (!limit.allowed) {
      return apiError(
        "PLAN_LIMIT_REACHED",
        `${workspace.plan} plan allows ${limit.limit} environments.`
      );
    }

    const { name } = await req.json();
    if (!name) return apiError("INVALID_INPUT", "Name is required.");

    const slug = slugify(name);

    const existing = await prisma.environment.findFirst({
      where: { workspaceId: workspace.id, slug }
    });

    if (existing) {
      return apiError("CONFLICT", "An environment with this name already exists.");
    }

    const env = await prisma.environment.create({
      data: {
        workspaceId: workspace.id,
        name,
        slug,
        isDefault: false
      }
    });

    await prisma.auditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: session.user.id,
        action: "CREATE",
        resourceType: "ENVIRONMENT",
        resourceId: env.id
      }
    });

    return apiSuccess(env);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    return apiError("INTERNAL_ERROR", "Failed to create environment.");
  }
}
