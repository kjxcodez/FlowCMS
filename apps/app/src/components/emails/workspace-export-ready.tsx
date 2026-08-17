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

export interface WorkspaceExportReadyEmailProps {
  workspaceName: string;
  downloadUrl: string;
  expiresAt: string;
  fileSize?: string;
  format: "JSON" | "CSV";
}

export function WorkspaceExportReadyEmail({
  workspaceName,
  downloadUrl,
  expiresAt,
  fileSize,
  format,
}: WorkspaceExportReadyEmailProps) {
  const expiryDisplay = new Date(expiresAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <EmailLayout
      preview={`Your ${workspaceName} export is ready for download.`}
      tagline="SYSTEM"
    >
      <Section style={{ marginBottom: "32px" }}>
        <div style={{ marginBottom: "16px" }}>
          <Badge variant="success">Export complete</Badge>
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
          Your content export is ready.
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
          The full export of your{" "}
          <strong style={{ color: tokens.ink }}>{workspaceName}</strong>{" "}
          workspace content has been processed and is now available for
          download.
        </Text>

        <PrimaryButton href={downloadUrl}>Download {format} file →</PrimaryButton>
      </Section>

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
          <strong>For security, this link expires {expiryDisplay}</strong>. After
          this time, you will need to request a new export from your dashboard.
        </Text>
      </Callout>

      <Hr style={styles.hr} />

      <Section>
        <Label>Export Details</Label>
        <div style={{ marginTop: "16px" }}>
          <div style={{ marginBottom: "8px" }}>
            <Label>Format</Label>
            <Text
              style={{
                fontFamily: styles.fontUi,
                fontSize: "14px",
                color: tokens.ink,
                margin: "2px 0 0",
              }}
            >
              {format}
            </Text>
          </div>
          {fileSize && (
            <div>
              <Label>File size</Label>
              <Text
                style={{
                  fontFamily: styles.fontUi,
                  fontSize: "14px",
                  color: tokens.ink,
                  margin: "2px 0 0",
                }}
              >
                {fileSize}
              </Text>
            </div>
          )}
        </div>
      </Section>
    </EmailLayout>
  );
}

export default WorkspaceExportReadyEmail;
