import { z } from "zod";

export const CreateEntrySchema = z.object({
  collectionId: z.string(),
  slug: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/),
  data: z.record(z.string(), z.unknown()),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export const UpdateEntrySchema = z.object({
  slug: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});
