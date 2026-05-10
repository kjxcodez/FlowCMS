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

export interface VerificationEmailProps {
  verificationUrl: string;
  name?: string;
  /** Minutes until the token expires. Better Auth default is 24h (1440 min). */
  expiresInMinutes?: number;
}

export function VerificationEmail({
  verificationUrl,
  name,
  expiresInMinutes = 1440,
}: VerificationEmailProps) {
  const firstName = name?.split(" ")[0];
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";

  const expiresHours = Math.round(expiresInMinutes / 60);
  const expiryDisplay =
    expiresInMinutes < 60
      ? `${expiresInMinutes} minutes`
      : `${expiresHours} hour${expiresHours !== 1 ? "s" : ""}`;

  return (
    <EmailLayout
      preview="Verify your FlowCMS email address to activate your account."
      tagline="ACCOUNT VERIFICATION"
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
          Verify your email address
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
          Click the button below to verify your email address and activate your
          FlowCMS account.
        </Text>

        <PrimaryButton href={verificationUrl}>
          Verify email address →
        </PrimaryButton>

        <Text
          style={{
            fontFamily: styles.fontUi,
            fontSize: "11px",
            color: tokens.inkFaint,
            margin: "12px 0 0",
            lineHeight: "1.5",
          }}
        >
          This link expires in {expiryDisplay}.
        </Text>
      </Section>

      <Hr style={styles.hr} />

      <Section style={{ marginBottom: "8px" }}>
        <Label>Having trouble with the button?</Label>
        <Text
          style={{
            fontFamily: styles.fontUi,
            fontSize: "13px",
            color: tokens.inkMuted,
            lineHeight: "1.6",
            margin: "8px 0 12px",
          }}
        >
          Copy and paste this link into your browser:
        </Text>

        <Callout variant="default">
          <a
            href={verificationUrl}
            style={{
              fontFamily: styles.fontMono,
              fontSize: "11px",
              color: tokens.accent,
              textDecoration: "none",
              wordBreak: "break-all",
              display: "block",
              lineHeight: "1.6",
            }}
          >
            {verificationUrl}
          </a>
        </Callout>
      </Section>

      <Hr style={styles.hr} />

      <Section>
        <Text
          style={{
            fontFamily: styles.fontUi,
            fontSize: "12px",
            color: tokens.inkFaint,
            lineHeight: "1.6",
            margin: "0",
          }}
        >
          <strong style={{ color: tokens.inkMuted }}>
            Didn't create a FlowCMS account?
          </strong>{" "}
          You can safely ignore this email. No account has been created.
        </Text>
      </Section>
    </EmailLayout>
  );
}
