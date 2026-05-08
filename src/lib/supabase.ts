import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function uploadMedia(
  workspaceId: string,
  file: File
): Promise<{ url: string; path: string }> {
  const ext = file.name.split(".").pop();
  const path = `${workspaceId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("media")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage
    .from("media")
    .getPublicUrl(path);

  return { url: data.publicUrl, path };
}

export async function deleteMedia(path: string): Promise<void> {
  await supabase.storage.from("media").remove([path]);
}
