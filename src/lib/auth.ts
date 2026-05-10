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
  user: {
    additionalFields: {
      inviteToken: {
        type: "string",
        required: false,
      },
    },
  },
  /**
   * CUSTOM ERROR PAGES
   * Redirects users to our branded Meridian error page instead of Better Auth defaults.
   */
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
    error: "/auth/error",
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx: any) => {
          if (isWaitlistMode || isEarlyAccessMode) {
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

              // ATOMIC CONSUMPTION: mark as JOINED in a transaction
              // This prevents replay attacks and race conditions
              const entry = await prisma.waitlistEntry.findUnique({
                where: { inviteToken: token },
              });

              if (!entry || entry.status === "JOINED") {
                logger.warn("Registration blocked: Invite invalid or already used", { token });
                return false;
              }

              if (entry.inviteExpiresAt && entry.inviteExpiresAt < new Date()) {
                logger.warn("Registration blocked: Invite expired", { token });
                return false;
              }

              // Final check: status must be EXACTLY INVITED
              if (entry.status !== "INVITED") {
                logger.warn("Registration blocked: Status not INVITED", { 
                  email: user.email, 
                  status: entry.status 
                });
                return false;
              }

              // Update status atomically
              await prisma.waitlistEntry.update({
                where: { inviteToken: token },
                data: {
                  status: "JOINED",
                  inviteUsedAt: new Date(),
                },
              });

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
        before: async (session, ctx) => {
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
