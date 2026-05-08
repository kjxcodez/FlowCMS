import { z } from "zod";

export const RegisterWorkspaceSchema = z.object({
  workspaceName: z.string().min(1).max(64),
  userId: z.string(),
});
