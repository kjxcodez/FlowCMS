import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { uploadMedia } from "@/lib/supabase";

export async function GET() {
  const { workspace } = await requireWorkspace();
  const media = await prisma.media.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
  });
  return apiSuccess(media);
}

export async function POST(req: NextRequest) {
  const { workspace } = await requireWorkspace();
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return apiError("INVALID_INPUT", "No file provided.");

  if (file.size > 10 * 1024 * 1024) {
    return apiError("INVALID_INPUT", "File exceeds 10MB limit.");
  }

  const { url } = await uploadMedia(workspace.id, file);

  const media = await prisma.media.create({
    data: {
      workspaceId: workspace.id,
      filename: file.name,
      url,
      mimeType: file.type,
      size: file.size,
    },
  });

  return apiSuccess(media);
}
