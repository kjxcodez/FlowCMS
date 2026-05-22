import { withApiAuth } from "@/middleware/with-api-auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";

export const runtime = "nodejs";

export const GET = withApiAuth(async (req, { workspaceId }) => {
  // Use the param from the URL
  const { collectionSlug } = (req as any).params || {};  // eslint-disable-line @typescript-eslint/no-explicit-any
  // In Next.js App Router with withApiAuth, we might need to handle params differently if it's wrapped.
  // Actually, req.nextUrl.pathname works too.
  const slug = collectionSlug || req.nextUrl.pathname.split("/").at(-1)!;

  const { searchParams } = req.nextUrl;
  // const status = searchParams.get("status") ?? "published";
  const page = parseInt(searchParams.get("page") ?? "1");
  const perPage = Math.min(
    parseInt(searchParams.get("perPage") ?? "20"),
    100
  );

  const collection = await prisma.collection.findUnique({
    where: { workspaceId_slug: { workspaceId, slug } },
  });

  if (!collection) {
    return apiError("NOT_FOUND", `Collection "${slug}" not found.`);
  }

  const where = {
    collectionId: collection.id,
    status: "PUBLISHED" as const, // Strictly enforce published only for public API
  };

  const [entries, total] = await Promise.all([
    prisma.entry.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.entry.count({ where }),
  ]);

  // Relation Expansion Logic
  const expand = searchParams.get("expand") === "true" || searchParams.get("expand") === "all";
  
  if (expand && entries.length > 0) {
    // 1. Identify reference fields
    const fields = (collection.fields as any[]) || []; // eslint-disable-line @typescript-eslint/no-explicit-any
    const referenceFields = fields.filter(f => f.type === "reference").map(f => f.slug);

    if (referenceFields.length > 0) {
      // 2. Collect all referenced IDs
      const allRefIds = new Set<string>();
      entries.forEach(entry => {
        const data = entry.data as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        referenceFields.forEach(slug => {
          if (data[slug] && typeof data[slug] === "string") {
            allRefIds.add(data[slug]);
          }
        });
      });

      if (allRefIds.size > 0) {
        // 3. Fetch all referenced entries in one go
        const referencedEntries = await prisma.entry.findMany({
          where: { id: { in: Array.from(allRefIds) } }
        });
        
        const refMap = new Map(referencedEntries.map(e => [e.id, e]));

        // 4. Inject referenced entries back into data
        entries.forEach(entry => {
          const data = entry.data as any; // eslint-disable-line @typescript-eslint/no-explicit-any
          referenceFields.forEach(slug => {
            if (data[slug] && refMap.has(data[slug])) {
              data[`_${slug}_expanded`] = refMap.get(data[slug]);
            }
          });
        });
      }
    }
  }

  return apiSuccess(entries, { total, page, perPage });
});
