import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { slugify } from "@/lib/utils";
import { RegisterWorkspaceSchema } from "@/lib/validations/workspace";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = RegisterWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_INPUT", parsed.error.issues[0].message);
  }

  const { workspaceName, userId } = parsed.data;
  let slug = slugify(workspaceName);

  // Ensure unique slug
  const existing = await prisma.workspace.findUnique({
    where: { slug },
  });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  await prisma.workspace.create({
    data: {
      name: workspaceName,
      slug,
      plan: "HOBBY",
      members: {
        create: { userId, role: "OWNER" },
      },
    },
  });

  return apiSuccess({ ok: true });
}
