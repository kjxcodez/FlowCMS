import { Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import {
  Badge,
  Callout,
  EmailLayout,
  Label,
  PrimaryButton,
  SecondaryButton,
  styles,
  tokens,
} from "./email-layout";

export interface WaitlistConfirmationEmailProps {
  position: number;
  referralUrl: string;
  confirmUrl: string;
  name?: string;
  referralCount?: number;
}

export function WaitlistConfirmationEmail({
  position,
  referralUrl,
  confirmUrl,
  name,
  referralCount = 0,
}: WaitlistConfirmationEmailProps) {
  const greeting = name ? `Hi ${name.split(" ")[0]},` : "Hi,";
  const spotsMovedUp = referralCount > 0 ? referralCount * 5 : null;

  return (
    <EmailLayout
      preview={`You're #${position} on the FlowCMS waitlist — confirm your spot.`}
      tagline="EARLY ACCESS"
      footerNote="Reply to this email if you have questions — I read every message."
    >
      {/* ── Position hero ─────────────────────────────────── */}
      <Section style={{ marginBottom: "32px" }}>
        <div
          style={{
            borderLeft: `3px solid ${tokens.accentBright}`,
            paddingLeft: "20px",
            marginBottom: "24px",
          }}
        >
          <Label>Your waitlist position</Label>
          <div
            style={{
              fontFamily: styles.fontDisplay,
              fontSize: "56px",
              fontWeight: "600",
              color: tokens.ink,
              letterSpacing: "-0.02em",
              lineHeight: "1",
              margin: "8px 0 4px",
            }}
          >
            #{position}
          </div>
          {referralCount > 0 && (
            <Badge variant="success">
              {referralCount} referral{referralCount !== 1 ? "s" : ""} —{" "}
              moved up {spotsMovedUp} spots
            </Badge>
          )}
        </div>

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
            margin: "0 0 24px",
          }}
        >
          You're on the list. FlowCMS is in private beta — we're letting people
          in carefully, in order. We'll email you the moment your spot opens up.
        </Text>

        <div style={{ marginBottom: "8px" }}>
          <PrimaryButton href={confirmUrl}>Confirm my email →</PrimaryButton>
        </div>
        <Text
          style={{
            fontFamily: styles.fontUi,
            fontSize: "11px",
            color: tokens.inkFaint,
            margin: "8px 0 0",
          }}
        >
          Required to hold your spot. Link expires in 48 hours.
        </Text>
      </Section>

      <Hr style={styles.hr} />

      {/* ── Referral section ──────────────────────────────── */}
      <Section style={{ marginBottom: "8px" }}>
        <Text
          style={{
            fontFamily: styles.fontDisplay,
            fontSize: "18px",
            fontWeight: "600",
            color: tokens.ink,
            margin: "0 0 8px",
            letterSpacing: "-0.01em",
          }}
        >
          Move up the list
        </Text>
        <Text
          style={{
            fontFamily: styles.fontUi,
            fontSize: "14px",
            color: tokens.inkMuted,
            lineHeight: "1.65",
            margin: "0 0 16px",
          }}
        >
          Every person who joins using your link moves you up{" "}
          <strong style={{ color: tokens.ink }}>5 positions</strong>. Share
          yours:
        </Text>

        <Callout variant="accent">
          <Label>Your referral link</Label>
          <div style={{ marginTop: "8px" }}>
            <a
              href={referralUrl}
              style={{
                fontFamily: styles.fontMono,
                fontSize: "12px",
                color: tokens.accent,
                textDecoration: "none",
                wordBreak: "break-all",
                display: "block",
              }}
            >
              {referralUrl}
            </a>
          </div>
        </Callout>

        <div style={{ marginTop: "16px" }}>
          <SecondaryButton href={referralUrl}>Copy referral link</SecondaryButton>
        </div>
      </Section>

      <Hr style={styles.hr} />

      {/* ── What to expect ───────────────────────────────── */}
      <Section>
        <Text
          style={{
            fontFamily: styles.fontDisplay,
            fontSize: "18px",
            fontWeight: "600",
            color: tokens.ink,
            margin: "0 0 16px",
            letterSpacing: "-0.01em",
          }}
        >
          What you're getting access to
        </Text>

        {[
          {
            label: "Block editor",
            desc: "A structured visual editor built for content teams who care about output quality.",
          },
          {
            label: "Content API",
            desc: "Type-safe REST + GraphQL endpoints generated from your schema. Fetch it anywhere.",
          },
          {
            label: "30 days PRO free",
            desc: "No card required. Full access on day one, no feature gates.",
          },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", marginBottom: "16px" }}>
            <div
              style={{
                width: "6px",
                height: "6px",
                backgroundColor: tokens.accentBright,
                borderRadius: "50%",
                marginTop: "6px",
                marginRight: "14px",
                flexShrink: 0,
              }}
            />
            <div>
              <Text
                style={{
                  fontFamily: styles.fontUi,
                  fontSize: "13px",
                  fontWeight: "600",
                  color: tokens.ink,
                  margin: "0 0 2px",
                  letterSpacing: "0.02em",
                }}
              >
                {item.label}
              </Text>
              <Text
                style={{
                  fontFamily: styles.fontUi,
                  fontSize: "13px",
                  color: tokens.inkMuted,
                  margin: "0",
                  lineHeight: "1.6",
                }}
              >
                {item.desc}
              </Text>
            </div>
          </div>
        ))}
      </Section>
    </EmailLayout>
  );
}
