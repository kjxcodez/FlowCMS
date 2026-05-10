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

export interface ReferralMilestoneEmailProps {
  name?: string;
  referralCount: number;
  milestone: number;
  referralUrl: string;
}

export function ReferralMilestoneEmail({
  name,
  referralCount,
  milestone,
  referralUrl,
}: ReferralMilestoneEmailProps) {
  const firstName = name?.split(" ")[0];
  const greeting = firstName ? `Amazing work, ${firstName}!` : "Amazing work!";

  return (
    <EmailLayout
      preview={`You've hit ${milestone} referrals! You're moving up the list.`}
      tagline="MILESTONE REACHED"
    >
      <Section style={{ marginBottom: "32px" }}>
        <div style={{ marginBottom: "16px" }}>
          <Badge variant="accent">{milestone} Referrals</Badge>
        </div>

        <Text
          style={{
            fontFamily: styles.fontDisplay,
            fontSize: "28px",
            fontWeight: "600",
            color: tokens.ink,
            letterSpacing: "-0.02em",
            lineHeight: "1.25",
            margin: "0 0 16px",
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
          You just reached <strong style={{ color: tokens.ink }}>{milestone} referrals</strong>. 
          That&apos;s incredible! For every person you&apos;ve invited, you&apos;ve jumped ahead in the queue. 
          You are now significantly closer to getting full access to FlowCMS.
        </Text>

        <PrimaryButton href={referralUrl}>Check my position →</PrimaryButton>
      </Section>

      <Hr style={styles.hr} />

      <Section>
        <Label>Your Impact</Label>
        <Text
          style={{
            fontFamily: styles.fontUi,
            fontSize: "14px",
            color: tokens.inkMuted,
            lineHeight: "1.65",
            margin: "12px 0 0",
          }}
        >
          You have successfully invited {referralCount} people to the FlowCMS waitlist. 
          Keep sharing your link to reach the next milestone and claim your early access even sooner.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default ReferralMilestoneEmail;
