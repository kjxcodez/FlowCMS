import { createClient } from "@supabase/supabase-js";
import { StorageProvider, UploadResult } from "../types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class SupabaseStorageProvider implements StorageProvider {
  async upload(workspaceId: string, file: File): Promise<UploadResult> {
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

    const url = this.getPublicUrl(path);
    return { url, path };
  }

  async delete(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from("media")
      .remove([path]);

    if (error) throw new Error(error.message);
  }

  getPublicUrl(path: string): string {
    const { data } = supabase.storage
      .from("media")
      .getPublicUrl(path);

    return data.publicUrl;
  }
}
