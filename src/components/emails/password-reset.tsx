import { Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import {
  Callout,
  EmailLayout,
  Label,
  PrimaryButton,
  styles,
  tokens,
} from "./email-layout";

export interface PasswordResetEmailProps {
  resetUrl: string;
  name?: string;
  expiresInMinutes?: number;
  /** Approximate IP/location of the reset request, if captured */
  requestedFrom?: string;
}

export function PasswordResetEmail({
  resetUrl,
  name,
  expiresInMinutes = 60,
  requestedFrom,
}: PasswordResetEmailProps) {
  const firstName = name?.split(" ")[0];
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";

  const roundedHours = Math.round(expiresInMinutes / 60);
  const expiryDisplay =
    expiresInMinutes < 60
      ? `${expiresInMinutes} minutes`
      : `${roundedHours} hour${roundedHours !== 1 ? "s" : ""}`;

  return (
    <EmailLayout
      preview="Reset your FlowCMS password — this link expires soon."
      tagline="SECURITY"
    >
      <Section style={{ marginBottom: "32px" }}>
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
          Reset your password
        </Text>

        <Text
          style={{
            fontFamily: styles.fontUi,
            fontSize: "15px",
            color: tokens.ink,
            lineHeight: "1.7",
            margin: "0 0 8px",
          }}
        >
          {greeting}
        </Text>
        <Text
          style={{
            fontFamily: styles.fontUi,
            fontSize: "15px",
            color: tokens.inkMuted,
            lineHeight: "1.7",
            margin: "0 0 32px",
          }}
        >
          We received a request to reset the password for your FlowCMS account.
          This link will expire in{" "}
          <strong style={{ color: tokens.ink }}>{expiryDisplay}</strong>.
        </Text>

        <PrimaryButton href={resetUrl}>Reset my password →</PrimaryButton>

        <Text
          style={{
            fontFamily: styles.fontUi,
            fontSize: "11px",
            color: tokens.inkFaint,
            margin: "12px 0 0",
          }}
        >
          This link can only be used once.
        </Text>
      </Section>

      <Hr style={styles.hr} />

      <Section style={{ marginBottom: "24px" }}>
        <Label>Button not working?</Label>
        <Text
          style={{
            fontFamily: styles.fontUi,
            fontSize: "13px",
            color: tokens.inkMuted,
            margin: "8px 0 12px",
          }}
        >
          Paste this link into your browser:
        </Text>
        <Callout variant="default">
          <a
            href={resetUrl}
            style={{
              fontFamily: styles.fontMono,
              fontSize: "11px",
              color: tokens.accent,
              textDecoration: "none",
              wordBreak: "break-all",
              display: "block",
            }}
          >
            {resetUrl}
          </a>
        </Callout>
      </Section>

      <Hr style={styles.hr} />

      <Section>
        <Callout variant="warning">
          <Text
            style={{
              fontFamily: styles.fontUi,
              fontSize: "12px",
              color: tokens.warning,
              margin: "0 0 6px",
              fontWeight: "600",
            }}
          >
            Didn't request this?
          </Text>
          <Text
            style={{
              fontFamily: styles.fontUi,
              fontSize: "12px",
              color: tokens.inkMuted,
              margin: "0",
              lineHeight: "1.6",
            }}
          >
            If you didn't request a password reset, your password won't change
            — you can safely ignore this email.{" "}
            {requestedFrom && (
              <>
                This request came from{" "}
                <strong style={{ color: tokens.ink }}>{requestedFrom}</strong>.{" "}
              </>
            )}
            If you're concerned, reply to this email immediately.
          </Text>
        </Callout>
      </Section>
    </EmailLayout>
  );
}
