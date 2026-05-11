import { revalidateTag } from "next/cache";
import { logger } from "./logger";

const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;



/**
 * Purges Cloudflare cache by Cache-Tag and Next.js Data Cache via revalidateTag.
 * Call this when content is published or updated to ensure instant global updates.
 */
export async function purgeCacheTags(tags: string[]) {
  // 1. Invalidate Next.js Data Cache
  tags.forEach((tag) => {
    try {
      revalidateTag(tag);
    } catch (err) {
      // revalidateTag might fail if called outside of a request context in some versions,
      // but in Next 15 it's generally safe in server actions/routes.
      logger.warn("revalidateTag failed", { tag, error: String(err) });
    }
  });

  if (!CLOUDFLARE_ZONE_ID || !CLOUDFLARE_API_TOKEN) {

    logger.debug("Cloudflare credentials missing, skipping cache purge", { tags });
    return;
  }

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags }),
      }
    );

    const data = await res.json();
    if (!data.success) {
      logger.error("Cloudflare cache purge failed", { error: data.errors, tags });
    } else {
      logger.info("Cloudflare cache tags purged", { tags });
    }
  } catch (err) {
    logger.error("Cloudflare API exception", { error: String(err), tags });
  }
}
