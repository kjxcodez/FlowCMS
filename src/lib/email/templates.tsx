import * as React from "react";

interface WaitlistConfirmationProps {
  position: number;
  referralUrl: string;
  confirmUrl: string;
}

export function WaitlistConfirmationEmail({
  position,
  referralUrl,
  confirmUrl,
}: WaitlistConfirmationProps) {
  return (
    <div style={{ fontFamily: "sans-serif", color: "#18180F", padding: "40px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em" }}>FlowCMS</h1>
      <p>You&apos;re on the waitlist. We&apos;re building something worth waiting for.</p>
      <p style={{ fontSize: "18px" }}>You&apos;re <strong>#{position}</strong> on the waitlist.</p>
      <div style={{ marginTop: "32px", padding: "24px", backgroundColor: "#f9f9f9", border: "1px solid #e5e5e5" }}>
        <p style={{ margin: "0 0 16px 0" }}>Jump the queue — share your link and move up for every person who joins.</p>
        <a href={referralUrl} style={{ color: "#7C9D2E", textDecoration: "none", fontWeight: "bold" }}>{referralUrl}</a>
      </div>
      <div style={{ marginTop: "32px" }}>
        <a 
          href={confirmUrl} 
          style={{ 
            backgroundColor: "#CAFF4D", 
            color: "#18180F", 
            padding: "12px 24px", 
            textDecoration: "none", 
            fontWeight: "bold",
            display: "inline-block",
            borderRadius: "2px"
          }}
        >
          Confirm your email →
        </a>
      </div>
      <p style={{ marginTop: "40px", fontSize: "12px", color: "#666" }}>
        FlowCMS — The industrial-editorial headless CMS.
      </p>
    </div>
  );
}

interface InviteEmailProps {
  acceptUrl: string;
}

export function InviteEmail({ acceptUrl }: InviteEmailProps) {
  return (
    <div style={{ fontFamily: "sans-serif", color: "#18180F", padding: "40px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em" }}>FlowCMS</h1>
      <p>We&apos;ve saved you a spot. You&apos;re in.</p>
      <div style={{ marginTop: "32px" }}>
        <a 
          href={acceptUrl} 
          style={{ 
            backgroundColor: "#CAFF4D", 
            color: "#18180F", 
            padding: "12px 24px", 
            textDecoration: "none", 
            fontWeight: "bold",
            display: "inline-block",
            borderRadius: "2px"
          }}
        >
          Create my account →
        </a>
      </div>
      <p style={{ marginTop: "32px" }}>Your invite expires in 7 days.</p>
      <p>You&apos;ll have full access to the PRO plan free for 30 days. No credit card needed.</p>
      <p style={{ marginTop: "40px", fontSize: "12px", color: "#666" }}>
        PS: Reply to this email if you hit any issues — I&apos;m the founder and I read every message.
      </p>
    </div>
  );
}
