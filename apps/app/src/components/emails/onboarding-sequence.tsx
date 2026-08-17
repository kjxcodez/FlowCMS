import { Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import {
  EmailLayout,
  Label,
  PrimaryButton,
  styles,
  tokens,
} from "./email-layout";

export type OnboardingStep = "welcome" | "feature_spotlight" | "check_in";

export interface OnboardingEmailProps {
  step: OnboardingStep;
  name?: string;
  workspaceName?: string;
  ctaHref: string;
}

const STEP_CONFIG: Record<
  OnboardingStep,
  {
    preview: string;
    tagline: string;
    headline: string;
    body: (name?: string, workspace?: string) => string;
    ctaLabel: string;
  }
> = {
  welcome: {
    preview: "Welcome to FlowCMS — let's build something great.",
    tagline: "WELCOME",
    headline: "Welcome to the future of content.",
    body: (name, workspace) =>
      `Hi ${name ? name.split(" ")[0] : "there"}, welcome to FlowCMS! ${workspace ? `Your workspace **${workspace}** is ready.` : "We're excited to have you here."} FlowCMS is built for teams who want to build premium digital experiences without the overhead of traditional CMS platforms.`,
    ctaLabel: "Open my dashboard →",
  },
  feature_spotlight: {
    preview: "Quick tip: use the Block Editor for structured content.",
    tagline: "FEATURE SPOTLIGHT",
    headline: "Unlock the power of Blocks.",
    body: (name) =>
      `Hi ${name ? name.split(" ")[0] : "there"}, have you tried the Block Editor yet? It's the core of the FlowCMS experience — allowing you to build rich, structured layouts that remain perfectly type-safe for your developers.`,
    ctaLabel: "Try the editor →",
  },
  check_in: {
    preview: "Need any help getting started with FlowCMS?",
    tagline: "CHECK-IN",
    headline: "How's it going?",
    body: (name) =>
      `Hi ${name ? name.split(" ")[0] : "there"}, it's been a week since you joined. If you've hit any roadblocks or have questions about your setup, just reply to this email. I'm here to help you get the most out of FlowCMS.`,
    ctaLabel: "Go to workspace →",
  },
};

export function OnboardingEmail({
  step,
  name,
  workspaceName,
  ctaHref,
}: OnboardingEmailProps) {
  const config = STEP_CONFIG[step];

  return (
    <EmailLayout preview={config.preview} tagline={config.tagline}>
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
          {config.headline}
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
          {config.body(name, workspaceName)}
        </Text>

        <PrimaryButton href={ctaHref}>{config.ctaLabel}</PrimaryButton>
      </Section>

      <Hr style={styles.hr} />

      {step === "welcome" && (
        <Section>
          <Label>Next steps</Label>
          <div style={{ marginTop: "16px" }}>
            {[
              "Create your first Content Type",
              "Add a few entries in the Editor",
              "Fetch your data via the API",
            ].map((step, i) => (
              <div
                key={step}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "10px",
                    backgroundColor: tokens.canvas,
                    border: `1px solid ${tokens.border}`,
                    color: tokens.inkMuted,
                    fontSize: "10px",
                    textAlign: "center",
                    lineHeight: "18px",
                    marginRight: "12px",
                  }}
                >
                  {i + 1}
                </div>
                <Text
                  style={{
                    fontFamily: styles.fontUi,
                    fontSize: "13px",
                    color: tokens.ink,
                    margin: "0",
                  }}
                >
                  {step}
                </Text>
              </div>
            ))}
          </div>
        </Section>
      )}
    </EmailLayout>
  );
}

export default OnboardingEmail;
