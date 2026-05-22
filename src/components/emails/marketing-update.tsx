import { Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import {
  Badge,
  EmailLayout,
  Label,
  PrimaryButton,
  SecondaryButton,
  styles,
  tokens,
} from "./email-layout";

export interface MarketingUpdateEmailProps {
  /** Email subject preview / hero headline */
  headline: string;
  /** Short subheadline / deck */
  subheadline?: string;
  /** Body copy — plain text, no markdown */
  body: string;
  /** Primary CTA label and URL */
  cta?: { label: string; href: string };
  /** Secondary CTA — e.g. "Read the docs" */
  secondaryCta?: { label: string; href: string };
  /** Feature highlights shown as a list below the body */
  highlights?: Array<{ title: string; desc: string }>;
  /** Optional badge text shown above headline — e.g. "New Feature" / "v2.0" */
  badgeLabel?: string;
  badgeVariant?: "default" | "success" | "warning" | "accent";
  /** Unsubscribe URL */
  unsubscribeUrl?: string;
}

export function MarketingUpdateEmail({
  headline,
  subheadline,
  body,
  cta,
  secondaryCta,
  highlights,
  badgeLabel,
  badgeVariant = "accent",
  unsubscribeUrl,
}: MarketingUpdateEmailProps) {
  return (
    <EmailLayout
      preview={subheadline ?? headline}
      tagline="UPDATES"
    >
      {/* ── Hero ──────────────────────────────────────────── */}
      <Section style={{ marginBottom: "32px" }}>
        {badgeLabel && (
          <div style={{ marginBottom: "16px" }}>
            <Badge variant={badgeVariant}>{badgeLabel}</Badge>
          </div>
        )}

        <Text
          style={{
            fontFamily: styles.fontDisplay,
            fontSize: "26px",
            fontWeight: "600",
            color: tokens.ink,
            letterSpacing: "-0.02em",
            lineHeight: "1.25",
            margin: "0 0 12px",
          }}
        >
          {headline}
        </Text>

        {subheadline && (
          <Text
            style={{
              fontFamily: styles.fontUi,
              fontSize: "15px",
              color: tokens.inkMuted,
              lineHeight: "1.65",
              margin: "0 0 24px",
            }}
          >
            {subheadline}
          </Text>
        )}

        <Text
          style={{
            fontFamily: styles.fontUi,
            fontSize: "15px",
            color: tokens.ink,
            lineHeight: "1.75",
            margin: "0",
            whiteSpace: "pre-line",
          }}
        >
          {body}
        </Text>
      </Section>

      {/* ── Highlights ────────────────────────────────────── */}
      {highlights && highlights.length > 0 && (
        <>
          <Hr style={styles.hr} />
          <Section style={{ marginBottom: "32px" }}>
            <Label>What&apos;s new</Label>
            <div style={{ marginTop: "16px" }}>
              {highlights.map((item) => (
                <div
                  key={item.title}
                  style={{
                    borderLeft: `2px solid ${tokens.accentBright}`,
                    paddingLeft: "16px",
                    marginBottom: "20px",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: styles.fontUi,
                      fontSize: "13px",
                      fontWeight: "600",
                      color: tokens.ink,
                      margin: "0 0 3px",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={{
                      fontFamily: styles.fontUi,
                      fontSize: "13px",
                      color: tokens.inkMuted,
                      lineHeight: "1.55",
                      margin: "0",
                    }}
                  >
                    {item.desc}
                  </Text>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* ── CTAs ──────────────────────────────────────────── */}
      {(cta || secondaryCta) && (
        <>
          <Hr style={styles.hr} />
          <Section>
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {cta && <PrimaryButton href={cta.href}>{cta.label}</PrimaryButton>}
              {secondaryCta && (
                <SecondaryButton href={secondaryCta.href}>
                  {secondaryCta.label}
                </SecondaryButton>
              )}
            </div>
          </Section>
        </>
      )}

      {/* ── Unsubscribe ───────────────────────────────────── */}
      {unsubscribeUrl && (
        <>
          <Hr style={{ ...styles.hr, margin: "24px 0 16px" }} />
          <Text
            style={{
              fontFamily: styles.fontUi,
              fontSize: "11px",
              color: tokens.inkFaint,
              margin: "0",
              textAlign: "center",
            }}
          >
            You&apos;re receiving this because you signed up for FlowCMS early access or
            have an account.{" "}
            <a
              href={unsubscribeUrl}
              style={{ color: tokens.inkMuted, textDecoration: "underline" }}
            >
              Unsubscribe
            </a>
          </Text>
        </>
      )}
    </EmailLayout>
  );
}
