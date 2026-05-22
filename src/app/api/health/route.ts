import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Lightweight DB check
    await prisma.$queryRaw`SELECT 1`;

    return Response.json(
      { status: "ok", db: "connected", version: "1" },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch {
    return Response.json(
      { status: "error", db: "unreachable" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}
