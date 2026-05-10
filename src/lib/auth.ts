import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { isWaitlistMode, isEarlyAccessMode } from "@/lib/launch";
import { logger } from "@/lib/logger";
import { verifyInvitePayload } from "@/lib/tokens";

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
        before: async (user, ctx) => {
          // 1. ADMIN BYPASS: Founders skip all gating
          const adminEmails = (process.env.ADMIN_BYPASS_EMAILS ?? "").split(",").map(e => e.trim());
          if (adminEmails.includes(user.email)) {
            logger.info("Registration: Admin bypass granted", { email: user.email });
            return { data: user };
          }

          if (isWaitlistMode || isEarlyAccessMode) {
            // Ensure context exists before accessing cookies
            if (!ctx) {
              logger.warn("Registration blocked: No request context available", { email: user.email });
              return false;
            }

            const pendingInviteCookie = ctx.getCookie("pending_invite");
            
            if (!pendingInviteCookie) {
              logger.warn("Registration blocked: No pending invite cookie", { email: user.email });
              return false; // Better Auth will handle this via Layer 1 -> /auth/error
            }

            try {
              const payload = verifyInvitePayload(pendingInviteCookie);
              
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

              /**
               * ATOMIC CONSUMPTION: mark as JOINED using updateMany
               * This is the ONLY way to prevent race conditions where multiple requests
               * use the same token simultaneously. prisma.update() is NOT atomic for state checks.
               */
              const consumed = await prisma.waitlistEntry.updateMany({
                where: { 
                  inviteToken: token,
                  status: "INVITED", // Must be exactly INVITED
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
              logger.error("Failed to process invite cookie", { error: String(err) });
              return false;
            }
          }
          
          return { data: user };
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
            logger.warn("Login blocked: User suspended", { userId: user.id, email: user.email });
            return false;
          }

          return { data: session };
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
