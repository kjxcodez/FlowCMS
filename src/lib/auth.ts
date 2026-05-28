import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { isAdminEmail } from "./admin";
import { sendVerificationEmail } from "@/lib/email";
import { DEFAULT_LOGIN_REDIRECT } from "./routes";


export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Enforced via requireVerifiedSession(), not at API layer
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        to: user.email,
        name: user.name ?? undefined,
        verificationUrl: url,
      });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    redirectTo: DEFAULT_LOGIN_REDIRECT,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  /**
   * ISSUE 2: Remove session caching to prevent stale billing state.
   * Billing updates happen asynchronously via webhooks; sessions must rehydrate to reflect plan changes.
   */
  session: {
    // cookieCache is removed to ensure freshness
  },
  /**
   * Correct Better Auth hook architecture using databaseHooks.
   * Validates login state (e.g., checks if user is suspended) before session creation.
   */
    databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
          });

          if (!user) return false;

          if (user.isSuspended) {
            const isPlatformAdmin = isAdminEmail(user.email);
            if (isPlatformAdmin) return; // Emergency bypass for admins
            
            logger.warn("Login blocked: User suspended", { userId: user.id, email: user.email });
            return false;
          }
        },
      },
    },
  },
  onAPIError: {
    errorURL: "/auth/error",
  },
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"],
});

export type Auth = typeof auth;
