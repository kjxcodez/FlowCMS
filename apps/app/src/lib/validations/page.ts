import { z } from "zod";
import { BlockSchema } from "./common";

export const CreatePageSchema = z.object({
  title: z.string().min(1).max(128),
  slug: z.string().min(1).max(128).regex(/^[a-z0-9-]+$/),
  blocks: z.array(BlockSchema),
  seoTitle: z.string().max(70).optional(),
  seoDesc: z.string().max(160).optional(),
});

export const UpdatePageSchema = z.object({
  title: z.string().min(1).max(128).optional(),
  blocks: z.array(BlockSchema).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  seoTitle: z.string().max(70).optional(),
  seoDesc: z.string().max(160).optional(),
});
