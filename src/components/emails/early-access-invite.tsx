import { Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import {
  Badge,
  Callout,
  EmailLayout,
  Label,
  PrimaryButton,
  styles,
  tokens,
} from "./email-layout";

export interface EarlyAccessInviteEmailProps {
  acceptUrl: string;
  name?: string;
  /** ISO date string */
  expiresAt: string;
  position?: number;
  trialDays?: number;
}

export function EarlyAccessInviteEmail({
  acceptUrl,
  name,
  expiresAt,
  position,
  trialDays = 30,
}: EarlyAccessInviteEmailProps) {
  const firstName = name?.split(" ")[0];
  const greeting = firstName ? `${firstName},` : "Hello,";

  const expiryDate = new Date(expiresAt).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const daysRemaining = Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <EmailLayout
      preview="Your FlowCMS early access is ready. You're in."
      tagline="EARLY ACCESS INVITE"
      footerNote="PS: Reply to this email if you hit any issues — I'm the founder and I read every message."
    >
      {/* ── Hero ──────────────────────────────────────────── */}
      <Section style={{ marginBottom: "32px" }}>
        <div style={{ marginBottom: "20px" }}>
          <Badge variant="accent">You&apos;re in</Badge>
          {position && (
            <span
              style={{
                marginLeft: "8px",
                fontFamily: styles.fontUi,
                fontSize: "11px",
                color: tokens.inkFaint,
              }}
            >
              Waitlist position #{position}
            </span>
          )}
        </div>

        <Text
          style={{
            fontFamily: styles.fontDisplay,
            fontSize: "28px",
            fontWeight: "600",
            color: tokens.ink,
            letterSpacing: "-0.02em",
            lineHeight: "1.25",
            margin: "0 0 20px",
          }}
        >
          {greeting} your early access
          <br />
          to FlowCMS is ready.
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
          We&apos;ve been building carefully. You waited patiently. It&apos;s time. Click below to create your account and unlock{" "}
          <strong style={{ color: tokens.ink }}>
            {trialDays} days of PRO access
          </strong>{" "}
          — no credit card required.
        </Text>

        <PrimaryButton href={acceptUrl}>Claim my access →</PrimaryButton>

        <Callout variant="warning">
          <Text
            style={{
              fontFamily: styles.fontUi,
              fontSize: "12px",
              color: tokens.warning,
              margin: "0",
              lineHeight: "1.5",
            }}
          >
            <strong>This invite expires {expiryDate}</strong> —{" "}
            {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} from now. After
            that, your spot returns to the waitlist.
          </Text>
        </Callout>
      </Section>

      <Hr style={styles.hr} />

      {/* ── What's included ───────────────────────────────── */}
      <Section style={{ marginBottom: "32px" }}>
        <Label>What you get on day one</Label>

        <div style={{ marginTop: "16px" }}>
          {[
            {
              title: "Block editor",
              desc: "Structure content visually. Every block is typed, queryable, and version-controlled.",
            },
            {
              title: "Content API",
              desc: "REST + GraphQL endpoints generated from your schema. No config required.",
            },
            {
              title: "Workspace & team tools",
              desc: "Invite collaborators, manage roles, review publishing workflows.",
            },
            {
              title: `PRO plan — ${trialDays} days free`,
              desc: "All features, no card. Upgrade or cancel whenever you like.",
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                borderLeft: `2px solid ${tokens.border}`,
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

      <Hr style={styles.hr} />

      {/* ── API quick-start ───────────────────────────────── */}
      <Section>
        <Label>Technical quick-start</Label>
        <Text
          style={{
            fontFamily: styles.fontUi,
            fontSize: "13px",
            color: tokens.inkMuted,
            lineHeight: "1.65",
            margin: "12px 0 0",
          }}
        >
          Your workspace API will be available immediately after setup. Find
          your keys under{" "}
          <span
            style={{
              fontFamily: styles.fontMono,
              fontSize: "11px",
              color: tokens.inkMuted,
            }}
          >
            Settings → API
          </span>
          .
        </Text>
      </Section>
    </EmailLayout>
  );
}
