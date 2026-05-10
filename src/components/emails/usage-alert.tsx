import { Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import {
  Badge,
  EmailLayout,
  Label,
  PrimaryButton,
  styles,
  tokens,
} from "./email-layout";

export type UsageAlertVariant = "approaching" | "reached" | "exceeded";

export interface UsageAlertEmailProps {
  variant: UsageAlertVariant;
  resourceLabel: string; // e.g. "API requests"
  currentUsage: string; // e.g. "9,500"
  limit: string; // e.g. "10,000"
  percentage: number; // e.g. 95
  ctaHref: string;
}

const VARIANT_CONFIG: Record<
  UsageAlertVariant,
  {
    preview: string;
    badge: { label: string; variant: "default" | "warning" | "accent" };
    headline: string;
    body: (resource: string) => string;
  }
> = {
  approaching: {
    preview: "Usage alert: you're approaching your limit.",
    badge: { label: "Approaching limit", variant: "warning" },
    headline: "Usage alert",
    body: (resource) =>
      `You've used over 80% of your ${resource} for the current billing period. Consider upgrading your plan to avoid any service interruption.`,
  },
  reached: {
    preview: "Usage alert: you've reached your limit.",
    badge: { label: "Limit reached", variant: "warning" },
    headline: "Limit reached",
    body: (resource) =>
      `You've reached 100% of your ${resource} for the current billing period. Some services may be restricted until your next billing cycle or until you upgrade.`,
  },
  exceeded: {
    preview: "Action required: usage limit exceeded.",
    badge: { label: "Limit exceeded", variant: "accent" },
    headline: "Limit exceeded",
    body: (resource) =>
      `You've exceeded your ${resource} limit. To ensure continued service and avoid overage charges, please upgrade your plan now.`,
  },
};

export function UsageAlertEmail({
  variant,
  resourceLabel,
  currentUsage,
  limit,
  percentage,
  ctaHref,
}: UsageAlertEmailProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <EmailLayout preview={config.preview} tagline="USAGE ALERT">
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
          {config.body(resourceLabel)}
        </Text>

        {/* ── Progress bar ────────────────────────────────── */}
        <div
          style={{
            backgroundColor: "rgba(24, 24, 15, 0.06)",
            borderRadius: "4px",
            height: "8px",
            width: "100%",
            margin: "32px 0 12px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              backgroundColor: percentage >= 100 ? tokens.destructive : tokens.accent,
              height: "100%",
              width: `${Math.min(percentage, 100)}%`,
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Label>
            {currentUsage} / {limit} {resourceLabel}
          </Label>
          <Label>{percentage}%</Label>
        </div>

        <div style={{ marginTop: "32px" }}>
          <PrimaryButton href={ctaHref}>Upgrade plan →</PrimaryButton>
        </div>
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
          Usage alerts are sent automatically based on your current plan limits.
          You can manage your notification settings in your workspace dashboard.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default UsageAlertEmail;
