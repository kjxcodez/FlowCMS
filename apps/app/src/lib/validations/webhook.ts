import { z } from "zod";

export const CreateWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(
    z.enum([
      "ENTRY_CREATED",
      "ENTRY_UPDATED",
      "ENTRY_PUBLISHED",
      "ENTRY_DELETED",
      "PAGE_CREATED",
      "PAGE_UPDATED",
      "PAGE_PUBLISHED",
      "PAGE_DELETED",
      "COLLECTION_CREATED",
      "COLLECTION_UPDATED",
      "COLLECTION_DELETED",
      "MEDIA_UPLOADED",
      "MEDIA_UPDATED",
      "MEDIA_DELETED",
    ])
  ).min(1),
});
