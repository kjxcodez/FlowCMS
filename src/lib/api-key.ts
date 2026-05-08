import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { prisma } from "./prisma";

/** Generate a new API key: flw_<32 random chars> */
export function generateApiKey(): { raw: string; prefix: string } {
  const raw = `flw_${nanoid(32)}`;
  return { raw, prefix: raw.slice(0, 8) };
}

export async function hashApiKey(raw: string): Promise<string> {
  return bcrypt.hash(raw, 10);
}

export async function verifyApiKey(raw: string): Promise<{
  valid: boolean;
  workspaceId: string;
  plan: string;
  apiKeyId: string;
} | null> {
  const prefix = raw.slice(0, 8);
  const candidates = await prisma.apiKey.findMany({
    where: { keyPrefix: prefix },
    include: {
      workspace: { select: { id: true, plan: true } },
    },
  });

  for (const key of candidates) {
    const match = await bcrypt.compare(raw, key.keyHash);
    if (match) {
      // Fire-and-forget: update last used timestamp
      prisma.apiKey
        .update({
          where: { id: key.id },
          data: { lastUsedAt: new Date() },
        })
        .catch(() => {});

      return {
        valid: true,
        workspaceId: key.workspaceId,
        plan: key.workspace.plan,
        apiKeyId: key.id,
      };
    }
  }

  return null;
}
