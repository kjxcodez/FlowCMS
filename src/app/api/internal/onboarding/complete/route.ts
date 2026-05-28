import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { WorkspaceService } from "@/server/services/workspace.service";
import { apiError, apiSuccess } from "@/types/api";

export const runtime = "nodejs";

/**
 * POST /api/internal/onboarding/complete
 * Completes developer onboarding by triggering the consolidated Workspace provisioning transaction.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return apiError("UNAUTHORIZED", "Not logged in");
    }

    const body = await req.json();
    const { workspaceName, firstSchemaName } = body;

    // Run consolidated, idempotent provisioning transaction
    const result = await WorkspaceService.provisionWorkspace(
      session.user.id,
      workspaceName,
      firstSchemaName
    );

    return apiSuccess({
      ok: true,
      workspaceId: result.workspaceId,
      slug: result.slug,
      apiKey: result.apiKey,
    });
  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("Atomic complete onboarding route failure:", err);
    return apiError("INTERNAL_ERROR", "Failed to complete onboarding. Please try again.");
  }
}
