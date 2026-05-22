import { z } from "zod";

export const RegisterWorkspaceSchema = z.object({
  title: z.string().min(1).max(64),
});
