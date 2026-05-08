import { z } from "zod";

export const CreateEntrySchema = z.object({
  contentTypeId: z.string(),
  data: z.record(z.string(), z.unknown()),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export const UpdateEntrySchema = z.object({
  data: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});
