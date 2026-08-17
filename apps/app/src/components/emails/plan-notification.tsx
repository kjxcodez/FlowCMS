import { Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import {
  Badge,
  EmailLayout,
  PrimaryButton,
  SecondaryButton,
  styles,
  tokens,
} from "./email-layout";

export type PlanNotificationVariant =
  | "trial_started"
  | "trial_expiring"
  | "trial_expired"
  | "plan_upgraded"
  | "plan_downgraded"
  | "payment_failed"
  | "payment_succeeded";

export interface PlanNotificationEmailProps {
  variant: PlanNotificationVariant;
  name?: string;
  planName?: string;
  /** ISO date string — trial end, next billing date, etc. */
  relevantDate?: string;
  /** Billing amount in display format e.g. "$29/mo" */
  amount?: string;
  /** Primary CTA */
  cta?: { label: string; href: string };
  /** Secondary action — e.g. "Manage billing" */
  secondaryCta?: { label: string; href: string };
}

const VARIANT_CONFIG: Record<
  PlanNotificationVariant,
  {
    preview: string;
    tagline: string;
    badge: { label: string; variant: "default" | "success" | "warning" | "accent" };
    headline: string;
    body: (props: PlanNotificationEmailProps) => string;
    calloutVariant?: "default" | "accent" | "warning" | "success";
  }
> = {
  trial_started: {
    preview: "Your FlowCMS PRO trial has started.",
    tagline: "ACCOUNT",
    badge: { label: "Trial active", variant: "success" },
    headline: "Your PRO trial is live.",
    body: ({ planName = "PRO", relevantDate, name }) => {
      const firstName = name?.split(" ")[0];
      const dateLine = relevantDate
        ? ` Your trial runs until ${new Date(relevantDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`
        : "";
      return `${firstName ? `Hi ${firstName}, — ` : ""}you now have full access to FlowCMS ${planName}.${dateLine} No credit card required — explore everything at your own pace.`;
    },
    calloutVariant: "success",
  },
  trial_expiring: {
    preview: "Your FlowCMS trial expires in 3 days.",
    tagline: "ACCOUNT",
    badge: { label: "Trial expiring", variant: "warning" },
    headline: "Your trial ends soon.",
    body: ({ relevantDate }) => {
      const dateLine = relevantDate
        ? ` on ${new Date(relevantDate).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`
        : " soon";
      return `Your FlowCMS PRO trial expires${dateLine}. To keep your content, API access, and team workspace without interruption, upgrade before your trial ends.`;
    },
    calloutVariant: "warning",
  },
  trial_expired: {
    preview: "Your FlowCMS trial has ended.",
    tagline: "ACCOUNT",
    badge: { label: "Trial ended", variant: "default" },
    headline: "Your trial has ended.",
    body: ({ name }) => {
      const firstName = name?.split(" ")[0];
      return `${firstName ? `Hi ${firstName} — ` : ""}your FlowCMS PRO trial has expired. Your content and settings are safe, but publishing and API access are paused until you upgrade. It only takes a moment.`;
    },
    calloutVariant: "default",
  },
  plan_upgraded: {
    preview: "You're now on FlowCMS PRO.",
    tagline: "BILLING",
    badge: { label: "Upgraded", variant: "accent" },
    headline: "Welcome to PRO.",
    body: ({ planName = "PRO", amount }) => {
      const amountLine = amount ? ` You'll be billed ${amount}.` : "";
      return `Your FlowCMS account has been upgraded to ${planName}.${amountLine} All features are active — no limits, no gates.`;
    },
    calloutVariant: "success",
  },
  plan_downgraded: {
    preview: "Your FlowCMS plan has changed.",
    tagline: "BILLING",
    badge: { label: "Plan changed", variant: "default" },
    headline: "Your plan has been updated.",
    body: ({ planName = "Free" }) =>
      `Your FlowCMS account has been moved to the ${planName} plan. Some features may no longer be available. You can upgrade again anytime.`,
    calloutVariant: "default",
  },
  payment_failed: {
    preview: "Action required: FlowCMS payment failed.",
    tagline: "BILLING",
    badge: { label: "Payment failed", variant: "warning" },
    headline: "We couldn't process your payment.",
    body: ({ amount }) => {
      const amountLine = amount ? ` of ${amount}` : "";
      return `A payment${amountLine} for your FlowCMS subscription was declined. Please update your payment method to avoid service interruption. We'll retry in 3 days.`;
    },
    calloutVariant: "warning",
  },
  payment_succeeded: {
    preview: "FlowCMS payment confirmed.",
    tagline: "BILLING",
    badge: { label: "Payment confirmed", variant: "success" },
    headline: "Payment received.",
    body: ({ amount, relevantDate }) => {
      const amountLine = amount ? `${amount} ` : "";
      const dateLine = relevantDate
        ? ` Next payment on ${new Date(relevantDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`
        : "";
      return `Your FlowCMS payment of ${amountLine}was processed successfully. Thank you.${dateLine}`;
    },
    calloutVariant: "success",
  },
};

export function PlanNotificationEmail(props: PlanNotificationEmailProps) {
  const { variant, cta, secondaryCta } = props;
  const config = VARIANT_CONFIG[variant];

  return (
    <EmailLayout preview={config.preview} tagline={config.tagline}>
      <Section style={{ marginBottom: "32px" }}>
        <div style={{ marginBottom: "16px" }}>
          <Badge variant={config.badge.variant}>{config.badge.label}</Badge>
        </div>

        <Text
          style={{
            fontFamily: styles.fontDisplay,
            fontSize: "24px",
            fontWeight: "600",
            color: tokens.ink,
            letterSpacing: "-0.02em",
            lineHeight: "1.3",
            margin: "0 0 16px",
          }}
        >
          {config.headline}
        </Text>

        <Text
          style={{
            fontFamily: styles.fontUi,
            fontSize: "15px",
            color: tokens.inkMuted,
            lineHeight: "1.7",
            margin: "0 0 24px",
          }}
        >
          {config.body(props)}
        </Text>

        {(cta || secondaryCta) && (
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {cta && <PrimaryButton href={cta.href}>{cta.label}</PrimaryButton>}
            {secondaryCta && (
              <SecondaryButton href={secondaryCta.href}>
                {secondaryCta.label}
              </SecondaryButton>
            )}
          </div>
        )}
      </Section>

      <Hr style={styles.hr} />

      <Section>
        <Text
          style={{
            fontFamily: styles.fontUi,
            fontSize: "12px",
            color: tokens.inkFaint,
            margin: "0",
            lineHeight: "1.6",
          }}
        >
          This is an account notification from FlowCMS. If you have questions
          about your billing, reply to this email.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default PlanNotificationEmail;
