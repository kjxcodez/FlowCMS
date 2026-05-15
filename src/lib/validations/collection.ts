import { z } from "zod";

export const CollectionFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  type: z.string(),
  required: z.boolean(),
  multiple: z.boolean(),
});

export const CreateCollectionSchema = z.object({
  name: z.string().min(1).max(64),
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(255).optional(),
  fields: z.array(CollectionFieldSchema),
});

export const UpdateCollectionSchema = z.object({
  name: z.string().min(1).max(64).optional(),
  description: z.string().max(255).optional(),
  fields: z.array(CollectionFieldSchema).optional(),
});
