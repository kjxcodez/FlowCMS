import { NextRequest } from "next/server";
import { requireWorkspace, requireRole, ForbiddenError } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { slugify } from "@/lib/utils";
import { logger } from "@/lib/logger";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ envId: string }> }
) {
  let workspace;
  let envId;
  try {
    envId = (await params).envId;
    const sessionRes = await requireWorkspace();
    workspace = sessionRes.workspace;
    const { session, role } = sessionRes;
    await requireRole(role, "ADMIN");

    const env = await prisma.environment.findFirst({
      where: { id: envId, workspaceId: workspace.id }
    });

    if (!env) {
      return apiError("NOT_FOUND", "Environment not found.");
    }

    const { isDefault, name } = await req.json();

    if (isDefault !== undefined && isDefault) {
      // Transaction to set this environment as default and others not default
      await prisma.$transaction([
        prisma.environment.updateMany({
          where: { workspaceId: workspace.id, isDefault: true },
          data: { isDefault: false }
        }),
        prisma.environment.update({
          where: { id: env.id },
          data: { isDefault: true }
        }),
        prisma.auditLog.create({
          data: {
            workspaceId: workspace.id,
            userId: session.user.id,
            action: "UPDATE",
            resourceType: "ENVIRONMENT",
            resourceId: env.id,
            resourceName: env.name,
            after: { isDefault: true }
          }
        })
      ]);
      return apiSuccess({ isDefault: true });
    }

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return apiError("INVALID_INPUT", "Name cannot be empty.");
      }

      // Protect production slug: always keep it as "production"
      const slug = env.slug === "production" ? "production" : slugify(trimmedName);

      // Check for slug collision
      if (slug !== env.slug) {
        const collision = await prisma.environment.findFirst({
          where: { workspaceId: workspace.id, slug }
        });
        if (collision) {
          return apiError("CONFLICT", "An environment with this name already exists.");
        }
      }

      const updatedEnv = await prisma.environment.update({
        where: { id: env.id },
        data: {
          name: trimmedName,
          slug
        }
      });

      await prisma.auditLog.create({
        data: {
          workspaceId: workspace.id,
          userId: session.user.id,
          action: "UPDATE",
          resourceType: "ENVIRONMENT",
          resourceId: env.id,
          resourceName: trimmedName,
          after: { name: trimmedName, slug: updatedEnv.slug }
        }
      });

      return apiSuccess(updatedEnv);
    }

    return apiError("INVALID_INPUT", "No valid fields to update.");
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    logger.error("Environment update failed", {
      error: err,
      workspaceId: typeof workspace !== "undefined" ? workspace.id : undefined,
      environmentId: typeof envId !== "undefined" ? envId : undefined,
    });
    return apiError("INTERNAL_ERROR", "Failed to update environment.");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ envId: string }> }
) {
  let workspace;
  let envId;
  try {
    envId = (await params).envId;
    const sessionRes = await requireWorkspace();
    workspace = sessionRes.workspace;
    const { session, role } = sessionRes;
    await requireRole(role, "OWNER");

    const env = await prisma.environment.findFirst({
      where: { id: envId, workspaceId: workspace.id }
    });

    if (!env) {
      return apiError("NOT_FOUND", "Environment not found.");
    }

    // CRITICAL PROTECTION: Never allow deleting the default/production environment
    if (env.isDefault || env.slug === "production") {
      return apiError("INVALID_ACTION", "The Production environment is protected and cannot be deleted.");
    }

    // Check if entries exist in this environment
    const entryCount = await prisma.entry.count({
      where: { environmentId: env.id }
    });

    if (entryCount > 0) {
      return apiError("INVALID_ACTION", `Cannot delete environment containing ${entryCount} entries. Delete content first.`);
    }

    await prisma.environment.delete({
      where: { id: env.id }
    });

    await prisma.auditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: session.user.id,
        action: "DELETE",
        resourceType: "ENVIRONMENT",
        resourceId: env.id,
        resourceName: env.name
      }
    });

    return apiSuccess({ ok: true });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    logger.error("Environment delete failed", {
      error: err,
      workspaceId: typeof workspace !== "undefined" ? workspace.id : undefined,
      environmentId: typeof envId !== "undefined" ? envId : undefined,
    });
    return apiError("INTERNAL_ERROR", "Failed to delete environment.");
  }
}
