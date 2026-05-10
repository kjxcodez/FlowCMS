import { Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import {
  Badge,
  Callout,
  EmailLayout,
  Label,
  Mono,
  styles,
  tokens,
} from "./email-layout";

export type ApiKeyAction = "created" | "revoked";

export interface ApiKeyNotificationEmailProps {
  action: ApiKeyAction;
  keyName: string;
  maskedKey: string;
  actorName: string;
  workspaceName: string;
  settingsUrl: string;
}

export function ApiKeyNotificationEmail({
  action,
  keyName,
  maskedKey,
  actorName,
  workspaceName,
  settingsUrl,
}: ApiKeyNotificationEmailProps) {
  const isCreated = action === "created";

  return (
    <EmailLayout
      preview={`API key "${keyName}" was ${action} in ${workspaceName}.`}
      tagline="SECURITY ALERT"
    >
      <Section style={{ marginBottom: "32px" }}>
        <div style={{ marginBottom: "16px" }}>
          <Badge variant={isCreated ? "success" : "warning"}>
            Key {action}
          </Badge>
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
          API Key Security Update
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
          The API key <strong style={{ color: tokens.ink }}>{keyName}</strong> was{" "}
          <strong style={{ color: tokens.ink }}>{action}</strong> in the{" "}
          <strong style={{ color: tokens.ink }}>{workspaceName}</strong>{" "}
          workspace by <strong style={{ color: tokens.ink }}>{actorName}</strong>.
        </Text>
      </Section>

      <Callout variant={isCreated ? "accent" : "warning"}>
        <div style={{ marginBottom: "12px" }}>
          <Label>Key Name</Label>
          <Text
            style={{
              fontFamily: styles.fontUi,
              fontSize: "14px",
              fontWeight: "600",
              color: tokens.ink,
              margin: "4px 0 0",
            }}
          >
            {keyName}
          </Text>
        </div>
        <div>
          <Label>Token Preview</Label>
          <div style={{ marginTop: "6px" }}>
            <Mono>{maskedKey}</Mono>
          </div>
        </div>
      </Callout>

      <Section style={{ marginTop: "32px" }}>
        <Text
          style={{
            fontFamily: styles.fontUi,
            fontSize: "13px",
            color: tokens.inkMuted,
            lineHeight: "1.6",
            margin: "0 0 16px",
          }}
        >
          If this wasn&apos;t you or someone on your team, please review your workspace security settings immediately.
        </Text>
        <a
          href={settingsUrl}
          style={{
            fontFamily: styles.fontUi,
            fontSize: "13px",
            color: tokens.accent,
            textDecoration: "underline",
          }}
        >
          Review API settings →
        </a>
      </Section>

      <Hr style={styles.hr} />

      <Section>
        <Text
          style={{
            fontFamily: styles.fontUi,
            fontSize: "11px",
            color: tokens.inkFaint,
            margin: "0",
            lineHeight: "1.6",
          }}
        >
          This is a security notification from FlowCMS. These cannot be
          disabled for the safety of your workspace.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default ApiKeyNotificationEmail;
