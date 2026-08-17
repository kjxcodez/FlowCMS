import { requireWorkspace, requireRole, ForbiddenError } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/types/api";
import { logAction } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { razorpay } from "@/lib/razorpay";

export async function GET() {
  const { workspace, role } = await requireWorkspace();
  return apiSuccess({ name: workspace.name, plan: workspace.plan, slug: workspace.slug, role });
}

export async function PATCH(req: Request) {
  try {
    const { workspace, role, session } = await requireWorkspace();
    await requireRole(role, "ADMIN");

    const userId = session.user.id;

    const { name } = await req.json();
    if (!name || name.length < 2) {
      return apiError("INVALID_INPUT", "Workspace name must be at least 2 characters.");
    }

    const updated = await prisma.workspace.update({
      where: { id: workspace.id },
      data: { name },
    });

    logAction({
      workspaceId: workspace.id,
      userId,
      action: "UPDATE",
      resourceType: "WORKSPACE",
      resourceId: workspace.id,
      before: { name: workspace.name },
      after: { name: updated.name },
    });

    return apiSuccess({ name: updated.name, plan: updated.plan, slug: updated.slug, role });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    return apiError("INTERNAL_ERROR", "Failed to update workspace.");
  }
}

/** Subscription statuses that are already terminal and do not require cancellation. */
const TERMINAL_STATUSES = new Set(["cancelled", "expired", "completed"]);

export async function DELETE() {
  let workspace;
  let userId;
  try {
    const sessionRes = await requireWorkspace();
    workspace = sessionRes.workspace;
    const { role, session } = sessionRes;
    await requireRole(role, "OWNER");

    userId = session.user.id;

    // 1. Resolve billing/subscription record before any destructive action
    const customer = await prisma.razorpayCustomer.findUnique({
      where: { workspaceId: workspace.id },
    });

    // 2. Cancel active Razorpay subscription if one exists
    if (customer?.subscriptionId) {
      const isTerminal = customer.subscriptionStatus
        ? TERMINAL_STATUSES.has(customer.subscriptionStatus)
        : false;

      if (!isTerminal) {
        logger.info("Cancelling Razorpay subscription before workspace deletion", {
          workspaceId: workspace.id,
          subscriptionId: customer.subscriptionId,
          currentStatus: customer.subscriptionStatus,
        });

        try {
          // Cancel immediately (cancelAtCycleEnd = false)
          await razorpay.subscriptions.cancel(customer.subscriptionId, false);

          logger.info("Razorpay subscription cancelled successfully", {
            workspaceId: workspace.id,
            subscriptionId: customer.subscriptionId,
          });
        } catch (cancelErr: unknown) {
          // If the subscription no longer exists on Razorpay's side (404), proceed with deletion
          const statusCode = (cancelErr as { statusCode?: number })?.statusCode;
          if (statusCode === 404) {
            logger.warn("Razorpay subscription not found remotely, proceeding with deletion", {
              workspaceId: workspace.id,
              subscriptionId: customer.subscriptionId,
            });
          } else {
            // Cancellation failed for a non-terminal subscription — block deletion to prevent orphaned billing
            logger.error("Razorpay subscription cancellation failed, blocking workspace deletion", {
              workspaceId: workspace.id,
              subscriptionId: customer.subscriptionId,
              error: String(cancelErr),
            });
            return apiError(
              "INTERNAL_ERROR",
              "Failed to cancel subscription. Please try again or contact support."
            );
          }
        }
      } else {
        logger.info("Skipping Razorpay cancellation — subscription already terminal", {
          workspaceId: workspace.id,
          subscriptionId: customer.subscriptionId,
          status: customer.subscriptionStatus,
        });
      }
    }

    // 3. Delete workspace (cascade handles entries, members, billing records, etc.)
    await prisma.workspace.delete({
      where: { id: workspace.id },
    });

    logAction({
      workspaceId: workspace.id,
      userId,
      action: "DELETE",
      resourceType: "WORKSPACE",
      resourceId: workspace.id,
      resourceName: workspace.name,
    });

    return apiSuccess({ message: "Workspace deleted successfully" });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    logger.error("Failed to delete workspace", {
      error: err,
      workspaceId: typeof workspace !== "undefined" ? workspace.id : undefined,
      userId: typeof userId !== "undefined" ? userId : undefined,
    });
    return apiError("INTERNAL_ERROR", "Failed to delete workspace.");
  }
}
