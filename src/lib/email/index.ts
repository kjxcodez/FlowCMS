// src/lib/email/index.ts
//
// Single source of truth for all email sending in FlowCMS.
// Templates live in src/components/emails — import from there for previews.
//
import { Resend } from "resend";
import * as React from "react";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  WaitlistConfirmationEmail,
  EarlyAccessInviteEmail,
  VerificationEmail,
  PasswordResetEmail,
  WorkspaceInviteEmail,
  MarketingUpdateEmail,
  PlanNotificationEmail,
  UsageAlertEmail,
  OnboardingEmail,
  TeamMemberJoinedEmail,
  ContentPublishedEmail,
  ApiKeyNotificationEmail,
  WorkspaceExportReadyEmail,
  ReferralMilestoneEmail,
  ReEngagementEmail,
} from "@/components/emails";
import type {
  MarketingUpdateEmailProps,
  PlanNotificationEmailProps,
  UsageAlertEmailProps,
  WorkspaceInviteEmailProps,
  OnboardingEmailProps,
  TeamMemberJoinedEmailProps,
  ContentPublishedEmailProps,
  ApiKeyNotificationEmailProps,
  WorkspaceExportReadyEmailProps,
  ReferralMilestoneEmailProps,
  ReEngagementEmailProps,
} from "@/components/emails";

// ── Types ────────────────────────────────────────────────────────

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
}

interface SendResult {
  success: boolean;
  data?: unknown;
  error?: unknown;
}

// Typed shape for waitlist entries passed into send helpers.
// Keeps callers from using `any` while staying flexible for Prisma models.
interface WaitlistEntryPayload {
  id: string;
  email: string;
  name?: string | null;
  position: number;
  inviteToken?: string | null;
  referralCode?: string | null;
  referralCount?: number;
  inviteExpiresAt?: Date | null;
}

export type WaitlistEmailEvent = 
  | "WAITLIST_CONFIRMATION"
  | "WAITLIST_APPROVAL"
  | "WAITLIST_INVITE"
  | "WAITLIST_REVOKED"
  | "WAITLIST_SUSPENDED";

interface WorkspaceInvitePayload {
  email: string;
  workspaceName: string;
  invitedBy: string;
  inviteLink: string;
  role?: WorkspaceInviteEmailProps["role"];
  expiresAt?: string;
}

// ── Core sender ──────────────────────────────────────────────────

const resend = new Resend(process.env.RESEND_API_KEY);

const DEFAULT_FROM =
  process.env.RESEND_FROM_EMAIL ?? "FlowCMS <no-reply@mail.getflowcms.com>";

export async function sendEmail({
  to,
  subject,
  react,
  from = DEFAULT_FROM,
}: SendEmailOptions): Promise<SendResult> {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      react,
    });

    if (error) {
      logger.error("Failed to send email", { error, to, subject });
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    logger.error("Email service exception", {
      error: String(err),
      to,
      subject,
    });
    return { success: false, error: err };
  }
}

// ── Orchestrated Sender ──────────────────────────────────────────

interface OrchestrateOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
  idempotencyKey: string;
  eventType: WaitlistEmailEvent;
  waitlistEntryId?: string;
}

export async function orchestrateEmail({
  to,
  subject,
  react,
  idempotencyKey,
  eventType,
  waitlistEntryId,
}: OrchestrateOptions): Promise<SendResult> {
  // 1. Check for existing SENT log
  const existing = await prisma.emailLog.findUnique({
    where: { idempotencyKey },
  });

  if (existing?.status === "SENT") {
    logger.info("Email skipped: already sent", { idempotencyKey });
    return { success: true, data: existing.providerMessageId };
  }

  // 2. Create or update log to PENDING
  const templateName = typeof react.type === "string" 
    ? react.type 
    : (react.type as any).displayName || (react.type as any).name || "Unknown"; // eslint-disable-line @typescript-eslint/no-explicit-any

  const log = await prisma.emailLog.upsert({
    where: { idempotencyKey },
    create: {
      idempotencyKey,
      to,
      template: templateName,
      eventType,
      waitlistEntryId,
      status: "PENDING",
      attempts: 1,
      lastAttempt: new Date(),
    },
    update: {
      attempts: { increment: 1 },
      lastAttempt: new Date(),
      status: "PENDING",
    },
  });

  // 3. Send
  const result = await sendEmail({ to, subject, react });

  // 4. Update log
  await prisma.emailLog.update({
    where: { id: log.id },
    data: {
      status: result.success ? "SENT" : "FAILED",
      providerMessageId: result.data ? (result.data as any).id : null, // eslint-disable-line @typescript-eslint/no-explicit-any
      error: result.error ? JSON.stringify(result.error) : null,
    },
  });

  return result;
}

// ── Waitlist emails ──────────────────────────────────────────────

export async function sendWaitlistConfirmation(
  entry: WaitlistEntryPayload
): Promise<SendResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    logger.error("NEXT_PUBLIC_APP_URL is not set");
    return { success: false, error: "Missing NEXT_PUBLIC_APP_URL" };
  }

  if (!entry.inviteToken) {
    logger.error("sendWaitlistConfirmation: missing inviteToken", {
      id: entry.id,
    });
    return { success: false, error: "Missing inviteToken" };
  }

  const confirmUrl = `${appUrl}/api/waitlist/verify?token=${entry.inviteToken}`;
  const referralUrl = entry.referralCode
    ? `${appUrl}/?ref=${entry.referralCode}`
    : appUrl;

  return orchestrateEmail({
    to: entry.email,
    subject: `You're #${entry.position} on the FlowCMS waitlist`,
    idempotencyKey: `confirm_${entry.id}`,
    eventType: "WAITLIST_CONFIRMATION",
    waitlistEntryId: entry.id,
    react: React.createElement(WaitlistConfirmationEmail, {
      position: entry.position,
      referralUrl,
      confirmUrl,
      name: entry.name ?? undefined,
      referralCount: entry.referralCount ?? 0,
    }),
  });
}

export async function sendApprovalEmail(
  entry: WaitlistEntryPayload
): Promise<SendResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  // Repurpose EarlyAccessInviteEmail as an "Approval" notice if no specific template exists,
  // or use a placeholder if we want to be strict. For now, let's assume we have it.
  // We'll use the EarlyAccessInviteEmail but without the registration CTA if possible,
  // or just notify them that an invite is coming.
  
  return orchestrateEmail({
    to: entry.email,
    subject: "Good news: You've been approved for FlowCMS",
    idempotencyKey: `approve_${entry.id}`,
    eventType: "WAITLIST_APPROVAL",
    waitlistEntryId: entry.id,
    react: React.createElement(WaitlistConfirmationEmail, {
        position: entry.position,
        name: entry.name ?? undefined,
        confirmUrl: `${appUrl}/waitlist`, // Redirect to waitlist status page
        referralUrl: `${appUrl}/?ref=${entry.referralCode}`,
        referralCount: entry.referralCount ?? 0,
    }),
  });
}

export async function sendInviteEmail(
  entry: WaitlistEntryPayload
): Promise<SendResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    logger.error("NEXT_PUBLIC_APP_URL is not set");
    return { success: false, error: "Missing NEXT_PUBLIC_APP_URL" };
  }

  if (!entry.inviteToken) {
    logger.error("sendInviteEmail: missing inviteToken", { id: entry.id });
    return { success: false, error: "Missing inviteToken" };
  }

  const acceptUrl = `${appUrl}/api/waitlist/accept-invite?token=${entry.inviteToken}`;

  // Determine expiry — default to 7 days from now if not supplied
  const expiresAt = entry.inviteExpiresAt
    ? entry.inviteExpiresAt.toISOString()
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const result = await orchestrateEmail({
    to: entry.email,
    subject: "Your FlowCMS early access is ready",
    idempotencyKey: `invite_${entry.id}_${entry.inviteToken}`,
    eventType: "WAITLIST_INVITE",
    waitlistEntryId: entry.id,
    react: React.createElement(EarlyAccessInviteEmail, {
      acceptUrl,
      name: entry.name ?? undefined,
      expiresAt,
      position: entry.position,
    }),
  });

  return result;
}

// ── Auth emails (Better Auth integration) ────────────────────────

export async function sendVerificationEmail({
  to,
  name,
  verificationUrl,
  expiresInMinutes = 1440,
}: {
  to: string;
  name?: string;
  verificationUrl: string;
  expiresInMinutes?: number;
}): Promise<SendResult> {
  return sendEmail({
    to,
    subject: "Verify your FlowCMS email address",
    react: React.createElement(VerificationEmail, {
      verificationUrl,
      name,
      expiresInMinutes,
    }),
  });
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
  expiresInMinutes = 60,
  requestedFrom,
}: {
  to: string;
  name?: string;
  resetUrl: string;
  expiresInMinutes?: number;
  requestedFrom?: string;
}): Promise<SendResult> {
  return sendEmail({
    to,
    subject: "Reset your FlowCMS password",
    react: React.createElement(PasswordResetEmail, {
      resetUrl,
      name,
      expiresInMinutes,
      requestedFrom,
    }),
  });
}

// ── Workspace emails ──────────────────────────────────────────────

export async function sendWorkspaceInviteEmail(
  payload: WorkspaceInvitePayload
): Promise<SendResult> {
  return sendEmail({
    to: payload.email,
    subject: `You've been invited to join ${payload.workspaceName} on FlowCMS`,
    react: React.createElement(WorkspaceInviteEmail, {
      workspaceName: payload.workspaceName,
      invitedBy: payload.invitedBy,
      inviteLink: payload.inviteLink,
      role: payload.role,
      expiresAt: payload.expiresAt,
    }),
  });
}

// ── Marketing emails ──────────────────────────────────────────────

export async function sendMarketingUpdate(
  to: string | string[],
  props: Omit<MarketingUpdateEmailProps, never>
): Promise<SendResult> {
  return sendEmail({
    to,
    subject: props.headline,
    react: React.createElement(MarketingUpdateEmail, props),
  });
}

// ── Plan / billing notifications ──────────────────────────────────

export async function sendPlanNotification(
  to: string,
  props: PlanNotificationEmailProps
): Promise<SendResult> {
  const SUBJECT_MAP: Record<PlanNotificationEmailProps["variant"], string> = {
    trial_started: "Your FlowCMS PRO trial has started",
    trial_expiring: "Your FlowCMS trial expires soon",
    trial_expired: "Your FlowCMS trial has ended",
    plan_upgraded: "You're now on FlowCMS PRO",
    plan_downgraded: "Your FlowCMS plan has changed",
    payment_failed: "Action required: FlowCMS payment failed",
    payment_succeeded: "FlowCMS payment confirmed",
  };

  return sendEmail({
    to,
    subject: SUBJECT_MAP[props.variant],
    react: React.createElement(PlanNotificationEmail, props),
  });
}

// ── Usage alerts ──────────────────────────────────────────────────

export async function sendUsageAlert(
  to: string,
  props: UsageAlertEmailProps
): Promise<SendResult> {
  const SUBJECT_MAP: Record<UsageAlertEmailProps["variant"], string> = {
    approaching: `Usage alert: approaching ${props.resourceLabel} limit`,
    reached: `You've reached your ${props.resourceLabel} limit`,
    exceeded: `Action required: ${props.resourceLabel} limit exceeded`,
  };

  return sendEmail({
    to,
    subject: SUBJECT_MAP[props.variant],
    react: React.createElement(UsageAlertEmail, props),
  });
}

// ── Lifecycle / Onboarding emails ────────────────────────────────

export async function sendOnboardingEmail(
  to: string,
  props: OnboardingEmailProps
): Promise<SendResult> {
  const SUBJECT_MAP: Record<OnboardingEmailProps["step"], string> = {
    welcome: "Welcome to FlowCMS",
    feature_spotlight: "Unlock the power of Blocks in FlowCMS",
    check_in: "How's your FlowCMS setup going?",
  };

  return orchestrateEmail({
    to,
    subject: SUBJECT_MAP[props.step],
    idempotencyKey: `onboarding_${props.step}_${to}`,
    eventType: "WAITLIST_CONFIRMATION", // Repurposing type or add new one
    react: React.createElement(OnboardingEmail, props),
  });
}

// ── Content & Team Audits ────────────────────────────────────────

export async function sendTeamMemberJoined(
  to: string,
  props: TeamMemberJoinedEmailProps
): Promise<SendResult> {
  return sendEmail({
    to,
    subject: `${props.memberName} joined your FlowCMS workspace`,
    react: React.createElement(TeamMemberJoinedEmail, props),
  });
}

export async function sendContentPublished(
  to: string,
  props: ContentPublishedEmailProps
): Promise<SendResult> {
  return sendEmail({
    to,
    subject: `"${props.entryTitle}" is now live`,
    react: React.createElement(ContentPublishedEmail, props),
  });
}

// ── Security & System ────────────────────────────────────────────

export async function sendApiKeyNotification(
  to: string,
  props: ApiKeyNotificationEmailProps
): Promise<SendResult> {
  return sendEmail({
    to,
    subject: `FlowCMS Security Alert: API Key ${props.action}`,
    react: React.createElement(ApiKeyNotificationEmail, props),
  });
}

export async function sendWorkspaceExportReady(
  to: string,
  props: WorkspaceExportReadyEmailProps
): Promise<SendResult> {
  return sendEmail({
    to,
    subject: `Your ${props.workspaceName} export is ready`,
    react: React.createElement(WorkspaceExportReadyEmail, props),
  });
}

// ── Waitlist Engagement ──────────────────────────────────────────

export async function sendReferralMilestone(
  to: string,
  props: ReferralMilestoneEmailProps
): Promise<SendResult> {
  return sendEmail({
    to,
    subject: `Milestone reached: ${props.milestone} referrals!`,
    react: React.createElement(ReferralMilestoneEmail, props),
  });
}

export async function sendReEngagementEmail(
  to: string,
  props: ReEngagementEmailProps
): Promise<SendResult> {
  return sendEmail({
    to,
    subject: `It's been ${props.daysInactive} days — come see what's new`,
    react: React.createElement(ReEngagementEmail, props),
  });
}
