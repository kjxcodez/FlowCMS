import { Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import {
  EmailLayout,
  PrimaryButton,
  styles,
  tokens,
} from "./email-layout";

export interface ReEngagementEmailProps {
  name?: string;
  daysInactive: number;
  changesSince?: string[];
  ctaHref: string;
}

export function ReEngagementEmail({
  name,
  daysInactive,
  changesSince = [
    "Improved Block Editor performance",
    "New GraphQL Playground for developers",
    "Streamlined media management",
  ],
  ctaHref,
}: ReEngagementEmailProps) {
  const firstName = name?.split(" ")[0];
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";

  return (
    <EmailLayout
      preview={`It's been ${daysInactive} days — see what's new in FlowCMS.`}
      tagline="WE MISS YOU"
    >
      <Section style={{ marginBottom: "32px" }}>
        <Text
          style={{
            fontFamily: styles.fontDisplay,
            fontSize: "26px",
            fontWeight: "600",
            color: tokens.ink,
            letterSpacing: "-0.02em",
            lineHeight: "1.25",
            margin: "0 0 16px",
          }}
        >
          {greeting} come see what we&apos;ve built.
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
          It&apos;s been {daysInactive} days since you last logged into FlowCMS. 
          We&apos;ve been busy shipping updates to make your content workflow even smoother. 
          Here&apos;s what you might have missed:
        </Text>

        <div style={{ marginBottom: "32px" }}>
          {changesSince.map((change) => (
            <div
              key={change}
              style={{
                display: "flex",
                alignItems: "flex-start",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  backgroundColor: tokens.accentBright,
                  borderRadius: "50%",
                  marginTop: "8px",
                  marginRight: "12px",
                  flexShrink: 0,
                }}
              />
              <Text
                style={{
                  fontFamily: styles.fontUi,
                  fontSize: "14px",
                  color: tokens.ink,
                  margin: "0",
                  lineHeight: "1.5",
                }}
              >
                {change}
              </Text>
            </div>
          ))}
        </div>

        <PrimaryButton href={ctaHref}>Jump back in →</PrimaryButton>
      </Section>

      <Hr style={styles.hr} />

      <Section>
        <Text
          style={{
            fontFamily: styles.fontUi,
            fontSize: "13px",
            color: tokens.inkFaint,
            lineHeight: "1.6",
            margin: "0",
          }}
        >
          If you no longer wish to receive these updates, you can manage your
          preferences in your dashboard or reply to this email.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default ReEngagementEmail;
