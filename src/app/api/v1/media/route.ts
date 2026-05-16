import { apiError } from "@/types/api";

/**
 * Public Media Listing is DISABLED for security and privacy.
 * Media should be accessed via direct references in entries.
 */
export async function GET() {
  return apiError("FORBIDDEN", "Media listing is not allowed via the public API.");
}
