import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { generateApiKey, hashApiKey } from "@/lib/api-key";
import { CreateApiKeySchema } from "@/lib/validations/api-key";

export async function GET() {
  const { workspace } = await requireWorkspace();
  const keys = await prisma.apiKey.findMany({
    where: { workspaceId: workspace.id },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return apiSuccess(keys);
}

export async function POST(req: NextRequest) {
  const { workspace } = await requireWorkspace();
  const body = await req.json();
  const parsed = CreateApiKeySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_INPUT", "Name is required.");
  }

  // Max 5 keys per workspace
  const count = await prisma.apiKey.count({
    where: { workspaceId: workspace.id },
  });
  if (count >= 5) {
    return apiError(
      "PLAN_LIMIT_REACHED",
      "Maximum 5 API keys allowed."
    );
  }

  const { raw, prefix } = generateApiKey();
  const keyHash = await hashApiKey(raw);

  await prisma.apiKey.create({
    data: {
      workspaceId: workspace.id,
      name: parsed.data.name,
      keyHash,
      keyPrefix: prefix,
    },
  });

  // Return raw key only once — it can never be retrieved again
  return apiSuccess({ key: raw, prefix });
}

export async function DELETE(req: NextRequest) {
  const { workspace } = await requireWorkspace();
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  if (!id) return apiError("INVALID_INPUT", "Key ID required.");

  const result = await prisma.apiKey.deleteMany({
    where: { id, workspaceId: workspace.id },
  });
  if (!result.count) {
    return apiError("NOT_FOUND", "API key not found.");
  }
  return apiSuccess({ deleted: true });
}
