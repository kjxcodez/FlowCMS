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

export interface WorkspaceInviteEmailProps {
  workspaceName: string;
  invitedBy: string;
  inviteLink: string;
  role?: "admin" | "editor" | "viewer";
  expiresAt?: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: "Full access — manage content, settings, and team members.",
  editor: "Create and edit content entries. Cannot manage workspace settings.",
  viewer: "Read-only access to content and API documentation.",
};

export function WorkspaceInviteEmail({
  workspaceName,
  invitedBy,
  inviteLink,
  role = "editor",
  expiresAt,
}: WorkspaceInviteEmailProps) {
  const expiryDisplay = expiresAt
    ? new Date(expiresAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <EmailLayout
      preview={`${invitedBy} invited you to join ${workspaceName} on FlowCMS.`}
      tagline="WORKSPACE INVITE"
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
          You've been invited to join a workspace
        </Text>

        <Text
          style={{
            fontFamily: styles.fontUi,
            fontSize: "15px",
            color: tokens.inkMuted,
            lineHeight: "1.7",
            margin: "0",
          }}
        >
          <strong style={{ color: tokens.ink }}>{invitedBy}</strong> has invited
          you to collaborate on{" "}
          <strong style={{ color: tokens.ink }}>{workspaceName}</strong> on
          FlowCMS.
        </Text>
      </Section>

      <Callout variant="accent">
        <div style={{ marginBottom: "12px" }}>
          <Label>Workspace</Label>
          <Text
            style={{
              fontFamily: styles.fontDisplay,
              fontSize: "18px",
              fontWeight: "600",
              color: tokens.ink,
              margin: "4px 0 0",
              letterSpacing: "-0.01em",
            }}
          >
            {workspaceName}
          </Text>
        </div>
        <div>
          <Label>Your role</Label>
          <div style={{ marginTop: "6px" }}>
            <span
              style={{
                fontFamily: styles.fontMono,
                fontSize: "11px",
                fontWeight: "600",
                backgroundColor: tokens.sidebar,
                color: tokens.accentBright,
                padding: "2px 8px",
                borderRadius: "2px",
                letterSpacing: "0.06em",
              }}
            >
              {ROLE_LABELS[role] ?? role}
            </span>
          </div>
          <Text
            style={{
              fontFamily: styles.fontUi,
              fontSize: "12px",
              color: tokens.inkMuted,
              margin: "6px 0 0",
              lineHeight: "1.5",
            }}
          >
            {ROLE_DESCRIPTIONS[role] ?? "Collaborate on content."}
          </Text>
        </div>
      </Callout>

      <Section style={{ margin: "32px 0" }}>
        <PrimaryButton href={inviteLink}>Accept invitation →</PrimaryButton>

        {expiryDisplay && (
          <Text
            style={{
              fontFamily: styles.fontUi,
              fontSize: "11px",
              color: tokens.inkFaint,
              margin: "8px 0 0",
            }}
          >
            Invitation expires {expiryDisplay}.
          </Text>
        )}
      </Section>

      <Hr style={styles.hr} />

      <Section>
        <Label>Or paste this link into your browser</Label>
        <a
          href={inviteLink}
          style={{
            fontFamily: styles.fontMono,
            fontSize: "11px",
            color: tokens.accent,
            textDecoration: "none",
            wordBreak: "break-all",
            display: "block",
            marginTop: "8px",
            lineHeight: "1.7",
          }}
        >
          {inviteLink}
        </a>
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
          If you weren't expecting this invitation, you can ignore this email.
          This invite link will expire and your information will not be shared.
        </Text>
      </Section>
    </EmailLayout>
  );
}
