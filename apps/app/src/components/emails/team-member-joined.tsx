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

export interface TeamMemberJoinedEmailProps {
  adminName?: string;
  memberName: string;
  memberEmail: string;
  workspaceName: string;
  role: string;
  ctaHref: string;
}

export function TeamMemberJoinedEmail({
  adminName,
  memberName,
  memberEmail,
  workspaceName,
  role,
  ctaHref,
}: TeamMemberJoinedEmailProps) {
  return (
    <EmailLayout
      preview={`${memberName} has joined ${workspaceName}.`}
      tagline="WORKSPACE UPDATE"
    >
      <Section style={{ marginBottom: "32px" }}>
        <div style={{ marginBottom: "16px" }}>
          <Badge variant="success">New member</Badge>
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
          {memberName} is now part of your team.
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
          Hi {adminName ? adminName.split(" ")[0] : "there"}, your invitation to{" "}
          <strong style={{ color: tokens.ink }}>{memberEmail}</strong> was
          accepted. They now have access to the{" "}
          <strong style={{ color: tokens.ink }}>{workspaceName}</strong>{" "}
          workspace as an <strong style={{ color: tokens.ink }}>{role}</strong>.
        </Text>

        <PrimaryButton href={ctaHref}>Manage team settings →</PrimaryButton>
      </Section>

      <Hr style={styles.hr} />

      <Section>
        <Label>Member details</Label>
        <div
          style={{
            marginTop: "16px",
            padding: "16px",
            backgroundColor: tokens.canvas,
            borderRadius: "2px",
            border: `1px solid ${tokens.border}`,
          }}
        >
          <div style={{ marginBottom: "8px" }}>
            <Label>Name</Label>
            <Text
              style={{
                fontFamily: styles.fontUi,
                fontSize: "14px",
                color: tokens.ink,
                margin: "2px 0 0",
              }}
            >
              {memberName}
            </Text>
          </div>
          <div>
            <Label>Role</Label>
            <Text
              style={{
                fontFamily: styles.fontUi,
                fontSize: "14px",
                color: tokens.ink,
                margin: "2px 0 0",
                textTransform: "capitalize",
              }}
            >
              {role}
            </Text>
          </div>
        </div>
      </Section>
    </EmailLayout>
  );
}

export default TeamMemberJoinedEmail;
