import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface WorkspaceInviteEmailProps {
  workspaceName: string;
  invitedBy: string;
  inviteLink: string;
}

export const WorkspaceInviteEmail = ({
  workspaceName,
  invitedBy,
  inviteLink,
}: WorkspaceInviteEmailProps) => (
  <Html>
    <Head />
    <Preview>Join {workspaceName} on FlowCMS</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={heading}>FLOWCMS</Heading>
        </Section>
        <Section style={content}>
          <Text style={paragraph}>Hello,</Text>
          <Text style={paragraph}>
            <strong>{invitedBy}</strong> has invited you to join the{" "}
            <strong>{workspaceName}</strong> workspace on FlowCMS.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={inviteLink}>
              JOIN WORKSPACE
            </Button>
          </Section>
          <Text style={paragraph}>
            Or copy and paste this URL into your browser:{" "}
            <Link href={inviteLink} style={link}>
              {inviteLink}
            </Link>
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            FlowCMS — Structured content for modern teams.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: "#F5F2EC", // --canvas
  fontFamily: "'DM Sans', sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
};

const header = {
  padding: "32px",
  backgroundColor: "#1A1D16", // --sidebar
  textAlign: "center" as const,
};

const heading = {
  color: "#CAFF4D", // --accent-bright
  fontSize: "24px",
  fontWeight: "bold",
  letterSpacing: "4px",
  margin: "0",
};

const content = {
  backgroundColor: "#FDFBF7", // --paper
  padding: "40px",
  border: "1px solid #DDD9CF", // --border
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#18180F", // --ink
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#4E7C59", // --accent (Sap Green)
  borderRadius: "0px", // Sharp edges
  color: "#fff",
  fontSize: "14px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "16px 32px",
  letterSpacing: "2px",
};

const link = {
  color: "#4E7C59",
  textDecoration: "underline",
};

const hr = {
  borderColor: "#DDD9CF",
  margin: "40px 0",
};

const footer = {
  color: "#6B6A5E", // --ink-muted
  fontSize: "12px",
  textAlign: "center" as const,
  letterSpacing: "1px",
};
