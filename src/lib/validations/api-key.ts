import { z } from "zod";

export const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(64),
  scopes: z.array(
    z.enum([
      "read:entries",
      "write:entries",
      "read:media",
      "write:media",
      "read:webhooks",
      "write:webhooks",
      "read:collections",
      "write:collections",
      "admin:workspace",
    ])
  ).optional(),
});
