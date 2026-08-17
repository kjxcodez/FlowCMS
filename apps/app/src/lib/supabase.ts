import { createClient } from "@supabase/supabase-js";
import { storage } from "@/lib/storage";

// Preserve basic client export for any database-only auth calls
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Backward compatibility wrapper routing uploads to swappable storage.
 */
export async function uploadMedia(
  workspaceId: string,
  file: File
): Promise<{ url: string; path: string }> {
  return await storage.upload(workspaceId, file);
}

/**
 * Backward compatibility wrapper routing deletions to swappable storage.
 */
export async function deleteMedia(path: string): Promise<void> {
  await storage.delete(path);
}
