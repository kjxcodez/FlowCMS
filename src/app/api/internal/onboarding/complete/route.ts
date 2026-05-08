import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("UNAUTHORIZED", "Not logged in");

  const body = await req.json();
  const { workspaceName, firstSchemaName } = body;

  try {
    // 1. Update user as onboarded
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboarded: true }
    });

    // 2. Find the user's workspace (created at registration)
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      include: { workspace: true }
    });

    if (membership) {
      // 3. Update workspace name if provided
      if (workspaceName) {
        await prisma.workspace.update({
          where: { id: membership.workspaceId },
          data: { 
            name: workspaceName,
            slug: slugify(workspaceName) + "-" + Math.random().toString(36).substring(7)
          }
        });
      }

      // 4. Create the first content type if a template was selected
      if (firstSchemaName && firstSchemaName !== "Empty Vessel") {
        const fields = firstSchemaName === "Blog Engine" 
          ? [
              { id: "1", name: "Title", slug: "title", type: "text", required: true },
              { id: "2", name: "Content", slug: "content", type: "richtext", required: true },
              { id: "3", name: "Cover Image", slug: "cover", type: "media" }
            ]
          : [
              { id: "1", name: "Title", slug: "title", type: "text", required: true },
              { id: "2", name: "Body", slug: "body", type: "richtext" }
            ];

        await prisma.contentType.create({
          data: {
            workspaceId: membership.workspaceId,
            name: firstSchemaName,
            slug: slugify(firstSchemaName),
            fields: fields as any
          }
        });
      }
    }

    return apiSuccess({ ok: true });
  } catch (err: any) {
    console.error("Onboarding error:", err);
    return apiError("INTERNAL_ERROR", err.message);
  }
}
