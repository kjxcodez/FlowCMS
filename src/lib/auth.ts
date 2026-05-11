import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { isWaitlistMode, isEarlyAccessMode } from "@/lib/launch";
import { logger } from "@/lib/logger";
import { verifyInvitePayload } from "@/lib/tokens";
import { isAdminEmail } from "./admin";
import { headers } from "next/headers";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
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
   * ISSUE 1: Correct Better Auth hook architecture using databaseHooks.
   * Validates waitlist status at the database level before user creation.
   */
  /**
   * ISSUE 1: Correct Better Auth hook architecture using databaseHooks.
   * Validates waitlist status at the database level before user creation.
   */
  user: {
    additionalFields: {
      inviteToken: {
        type: "string",
        required: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const isPlatformAdmin = isAdminEmail(user.email);
          if (isPlatformAdmin) return; // Admins bypass waitlist gating

          const inviteToken = (await headers()).get("x-invite-token") || 
                            (await headers()).get("cookie")?.split("pending_invite=")[1]?.split(";")[0];

          if (isWaitlistMode || isEarlyAccessMode) {
            if (!inviteToken) {
              logger.warn("Registration blocked: No invite token found", { email: user.email });
              return false;
            }

            try {
              const payload = verifyInvitePayload(inviteToken);
              
              if (!payload) {
                logger.warn("Registration blocked: Invalid signature or payload", { email: user.email });
                return false;
              }

              const { token, email } = payload;
              
              if (email !== user.email) {
                logger.warn("Registration blocked: Email mismatch", { 
                  userEmail: user.email, 
                  inviteEmail: email 
                });
                return false;
              }

              const consumed = await prisma.waitlistEntry.updateMany({
                where: { 
                  inviteToken: token,
                  status: "INVITED",
                  OR: [
                    { inviteExpiresAt: null },
                    { inviteExpiresAt: { gt: new Date() } }
                  ]
                },
                data: {
                  status: "JOINED",
                  inviteUsedAt: new Date(),
                },
              });

              if (consumed.count !== 1) {
                logger.warn("Registration blocked: Token already consumed or invalid", { token });
                return false;
              }

              logger.info("Invite consumed successfully", { email: user.email });
            } catch (err) {
              logger.error("Failed to process invite token", { error: String(err) });
              return false;
            }
          }
        },
      },
    },
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
