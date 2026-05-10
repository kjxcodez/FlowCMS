import { Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import {
  Badge,
  EmailLayout,
  Label,
  Mono,
  PrimaryButton,
  styles,
  tokens,
} from "./email-layout";

export interface ContentPublishedEmailProps {
  entryTitle: string;
  contentType: string;
  authorName: string;
  workspaceName: string;
  publishedUrl: string;
  apiEndpoint: string;
}

export function ContentPublishedEmail({
  entryTitle,
  contentType,
  authorName,
  workspaceName,
  publishedUrl,
  apiEndpoint,
}: ContentPublishedEmailProps) {
  return (
    <EmailLayout
      preview={`"${entryTitle}" is now live in ${workspaceName}.`}
      tagline="CONTENT UPDATE"
    >
      <Section style={{ marginBottom: "32px" }}>
        <div style={{ marginBottom: "16px" }}>
          <Badge variant="success">Published</Badge>
        </div>

        <Text
          style={{
            fontFamily: styles.fontDisplay,
            fontSize: "24px",
            fontWeight: "600",
            color: tokens.ink,
            letterSpacing: "-0.02em",
            lineHeight: "1.3",
            margin: "0 0 12px",
          }}
        >
          {entryTitle}
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
          New content has been published to the{" "}
          <strong style={{ color: tokens.ink }}>{workspaceName}</strong>{" "}
          workspace by <strong style={{ color: tokens.ink }}>{authorName}</strong>.
        </Text>

        <PrimaryButton href={publishedUrl}>View in editor →</PrimaryButton>
      </Section>

      <Hr style={styles.hr} />

      <Section>
        <Label>Content Metadata</Label>
        <div style={{ marginTop: "16px" }}>
          <div style={{ marginBottom: "12px" }}>
            <Label>Type</Label>
            <div style={{ marginTop: "4px" }}>
              <Mono>{contentType}</Mono>
            </div>
          </div>
          <div>
            <Label>API Endpoint</Label>
            <div style={{ marginTop: "4px" }}>
              <Mono accent>{apiEndpoint}</Mono>
            </div>
          </div>
        </div>
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
          This is an automated audit notification. You can manage your
          notification preferences in your FlowCMS settings.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default ContentPublishedEmail;
