import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { WorkspaceService } from "@/server/services/workspace.service";
import { apiError, apiSuccess } from "@/types/api";
import { RegisterWorkspaceSchema } from "@/lib/validations/workspace";

export const runtime = "nodejs";

/**
 * POST /api/auth/register-workspace
 * Invoked during standard signups to trigger consolidated seeding and provisioning.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return apiError("UNAUTHORIZED", "Not logged in");
    }

    const body = await req.json();
    const parsed = RegisterWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", parsed.error.issues[0].message);
    }

    const { title } = parsed.data;

    // Run dynamic provisioning & default seeding pipeline
    const result = await WorkspaceService.provisionWorkspace(
      session.user.id,
      title
    );

    return apiSuccess({
      ok: true,
      workspaceId: result.workspaceId,
      slug: result.slug,
      apiKey: result.apiKey,
    });
  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("Workspace registration route exception:", err);
    return apiError("INTERNAL_ERROR", "Failed to register workspace and seed resources.");
  }
}
