import { withApiAuth, requireScope } from "@/middleware/with-api-auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { verifyDraftPreview } from "@/lib/preview";
import { EntryStatus } from "@/generated/prisma";

export const runtime = "nodejs";

interface CollectionField {
  slug: string;
  type: string;
}

export const GET = withApiAuth(
  requireScope("read:entries", async (req, { workspaceId, environmentId, params }) => {
    const resolvedParams = await params;
    const collectionSlug = resolvedParams?.collectionSlug;
    const slug = collectionSlug || req.nextUrl.pathname.split("/").at(-1)!;

    const { searchParams } = req.nextUrl;
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

    const includeDrafts = searchParams.get("preview") === "true";
    const where: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
      collectionId: collection.id,
      environmentId,
    };

    if (includeDrafts) {
      const previewToken = searchParams.get("token") || searchParams.get("_token") || req.headers.get("x-draft-token");
      const previewResult = await verifyDraftPreview({
        tokenValue: previewToken,
        workspaceId,
        collectionSlug: slug,
        environmentId: environmentId || undefined,
        ip: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      });

      if (!previewResult.allowed) {
        return apiError(
          previewResult.errorResponse!.code as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          previewResult.errorResponse!.message
        );
      }

      // Apply environment scoping if set on the token
      if (previewResult.token?.environmentId) {
        where.environmentId = previewResult.token.environmentId;
      }

      // Apply entry scoping if set on the token
      if (previewResult.token?.allowedEntryId) {
        where.id = previewResult.token.allowedEntryId;
      }
    } else {
      where.status = "PUBLISHED";
    }

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
      const fields = (collection.fields as unknown as CollectionField[]) || [];
      const referenceFields = fields.filter(f => f.type === "reference").map(f => f.slug);

      if (referenceFields.length > 0) {
        // 2. Collect all referenced IDs
        const allRefIds = new Set<string>();
        entries.forEach(entry => {
          const data = entry.data as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
          referenceFields.forEach(fieldSlug => {
            if (data[fieldSlug] && typeof data[fieldSlug] === "string") {
              allRefIds.add(data[fieldSlug]);
            }
          });
        });

        if (allRefIds.size > 0) {
          // 3. Fetch all referenced entries in one go
          const referencedEntries = await prisma.entry.findMany({
            where: {
              id: { in: Array.from(allRefIds) },
              workspaceId,
              environmentId,
              ...(includeDrafts ? {} : { status: EntryStatus.PUBLISHED }),
            }
          });
          
          const refMap = new Map(referencedEntries.map(e => [e.id, e]));

          // 4. Inject referenced entries back into data
          entries.forEach(entry => {
            const data = entry.data as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
            referenceFields.forEach(fieldSlug => {
              if (data[fieldSlug] && refMap.has(data[fieldSlug])) {
                data[`_${fieldSlug}_expanded`] = refMap.get(data[fieldSlug]);
              }
            });
          });
        }
      }
    }

    return apiSuccess(entries, { total, page, perPage });
  })
);
