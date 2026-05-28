import { StorageProvider } from "./types";
import { SupabaseStorageProvider } from "./providers/supabase";
import { LocalStorageProvider } from "./providers/local";

let storageInstance: StorageProvider;

if (process.env.STORAGE_PROVIDER === "supabase") {
  storageInstance = new SupabaseStorageProvider();
} else {
  // Default to offline-friendly local filesystem uploads
  storageInstance = new LocalStorageProvider();
}

export const storage = storageInstance;
