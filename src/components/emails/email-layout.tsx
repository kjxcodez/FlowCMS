import {
  Body,
  Container,
  Font,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

// ── Meridian design tokens ───────────────────────────────────────
export const tokens = {
  canvas: "#F5F2EC",
  paper: "#FDFBF7",
  sidebar: "#1A1D16",
  sidebarMid: "#252920",
  ink: "#18180F",
  inkMuted: "#6B6A5E",
  inkFaint: "#BFBCB0",
  inkInverse: "#E8E5DB",
  accent: "#4E7C59",
  accentBright: "#CAFF4D",
  accentDim: "#2E4A35",
  border: "#DDD9CF",
  borderStrong: "#B0AC9F",
  destructive: "#C94040",
  warning: "#D4820A",
  success: "#3A7D44",
} as const;

// ── Email-safe font stacks ───────────────────────────────────────
export const styles = {
  fontDisplay: "Georgia, 'Times New Roman', serif",
  fontUi: "Arial, Helvetica, sans-serif",
  fontMono: "'Courier New', Courier, monospace",

  body: {
    backgroundColor: tokens.canvas,
    margin: "0",
    padding: "0",
    WebkitTextSizeAdjust: "100%"
  } satisfies React.CSSProperties,

  outerContainer: {
    margin: "0 auto",
    padding: "40px 16px",
    maxWidth: "550px",
    width: "100%",
  } satisfies React.CSSProperties,

  header: {
    backgroundColor: tokens.sidebar,
    padding: "28px 40px",
    textAlign: "left" as const,
  } satisfies React.CSSProperties,

  logoText: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: "20px",
    fontWeight: "600" as const,
    color: "#FFFFFF",
    letterSpacing: "0.05em",
    margin: "0 0 4px 0",
    display: "block",
  } satisfies React.CSSProperties,

  logoTagline: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "10px",
    color: tokens.accentBright,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    margin: "0",
  } satisfies React.CSSProperties,

  card: {
    backgroundColor: tokens.paper,
    border: `1px solid ${tokens.border}`,
    borderTop: "none",
    padding: "40px",
  } satisfies React.CSSProperties,

  footer: {
    padding: "24px 40px",
    backgroundColor: tokens.canvas,
    borderTop: `1px solid ${tokens.border}`,
  } satisfies React.CSSProperties,

  footerText: {
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "11px",
    color: tokens.inkFaint,
    letterSpacing: "0.04em",
    margin: "0 0 4px 0",
    lineHeight: "1.6",
  } satisfies React.CSSProperties,

  footerLink: {
    color: tokens.accent,
    textDecoration: "none",
  } satisfies React.CSSProperties,

  hr: {
    borderColor: tokens.border,
    borderTopWidth: "1px",
    margin: "32px 0",
  } satisfies React.CSSProperties,
} as const;

// ── Reusable sub-components ──────────────────────────────────────

export function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      style={{
        display: "inline-block",
        backgroundColor: tokens.accentBright,
        color: tokens.ink,
        fontFamily: styles.fontUi,
        fontSize: "13px",
        fontWeight: "600",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        textDecoration: "none",
        padding: "14px 28px",
        borderRadius: "2px",
        lineHeight: "1",
      }}
    >
      {children}
    </a>
  );
}

export function SecondaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      style={{
        display: "inline-block",
        backgroundColor: "transparent",
        color: tokens.ink,
        fontFamily: styles.fontUi,
        fontSize: "13px",
        fontWeight: "500",
        letterSpacing: "0.06em",
        textDecoration: "none",
        padding: "13px 27px",
        borderRadius: "2px",
        border: `1px solid ${tokens.borderStrong}`,
        lineHeight: "1",
      }}
    >
      {children}
    </a>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: styles.fontUi,
        fontSize: "10px",
        fontWeight: "600",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: tokens.inkMuted,
      }}
    >
      {children}
    </span>
  );
}

export function Mono({
  children,
  accent = false,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      style={{
        fontFamily: styles.fontMono,
        fontSize: "12px",
        color: accent ? tokens.accent : tokens.inkMuted,
        backgroundColor: accent
          ? "rgba(78, 124, 89, 0.08)"
          : "rgba(24, 24, 15, 0.04)",
        padding: "2px 6px",
        borderRadius: "2px",
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </span>
  );
}

export function Callout({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "accent" | "warning" | "success";
}) {
  const variants = {
    default: {
      backgroundColor: tokens.canvas,
      borderLeft: `3px solid ${tokens.borderStrong}`,
    },
    accent: {
      backgroundColor: "rgba(78, 124, 89, 0.06)",
      borderLeft: `3px solid ${tokens.accent}`,
    },
    warning: {
      backgroundColor: "rgba(212, 130, 10, 0.06)",
      borderLeft: `3px solid ${tokens.warning}`,
    },
    success: {
      backgroundColor: "rgba(58, 125, 68, 0.06)",
      borderLeft: `3px solid ${tokens.success}`,
    },
  };

  return (
    <div
      style={{
        ...variants[variant],
        padding: "16px 20px",
        margin: "24px 0",
        borderRadius: "0 2px 2px 0",
      }}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "accent";
}) {
  const variants = {
    default: { bg: "rgba(24,24,15,0.06)", color: tokens.inkMuted },
    success: { bg: "rgba(58,125,68,0.12)", color: tokens.success },
    warning: { bg: "rgba(212,130,10,0.10)", color: tokens.warning },
    accent: { bg: tokens.accentBright, color: tokens.ink },
  };
  const v = variants[variant];
  return (
    <span
      style={{
        display: "inline-block",
        backgroundColor: v.bg,
        color: v.color,
        fontFamily: styles.fontUi,
        fontSize: "10px",
        fontWeight: "600",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "3px 10px",
        borderRadius: "100px",
        lineHeight: "1.6",
      }}
    >
      {children}
    </span>
  );
}

// ── Main layout ──────────────────────────────────────────────────

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
  tagline?: string;
  footerNote?: string;
}

export function EmailLayout({
  preview,
  children,
  tagline = "THE INDUSTRIAL-EDITORIAL CMS",
  footerNote,
}: EmailLayoutProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <Font
          fontFamily="DM Sans"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD8CmsM0p1-w.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="DM Sans"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD8Cm6M0p1-w.woff2",
            format: "woff2",
          }}
          fontWeight={600}
          fontStyle="normal"
        />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <div style={styles.outerContainer}>
          {/* ── Header band ─────────────────────────────── */}
          <div style={styles.header}>
            <span style={styles.logoText}>FlowCMS</span>
            <p style={styles.logoTagline}>{tagline}</p>
          </div>

          {/* ── Content card ────────────────────────────── */}
          <div style={styles.card}>{children}</div>

          {/* ── Footer ──────────────────────────────────── */}
          <div style={styles.footer}>
            <Text style={styles.footerText}>
              You received this email from{" "}
              <a href="https://flowcms.dev" style={styles.footerLink}>
                FlowCMS
              </a>
              . Questions? Reply directly to this email.
            </Text>
            {footerNote && (
              <Text
                style={{
                  ...styles.footerText,
                  marginTop: "8px",
                  fontStyle: "italic",
                }}
              >
                {footerNote}
              </Text>
            )}
            <Text style={{ ...styles.footerText, marginTop: "12px" }}>
              © {new Date().getFullYear()} FlowCMS. All rights reserved.
            </Text>
          </div>
        </div>
      </Body>
    </Html>
  );
}
