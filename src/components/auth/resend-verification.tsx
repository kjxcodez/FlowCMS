"use client";

import { useState, useEffect, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

const COOLDOWN_SECONDS = 60;

interface Props {
  email: string;
}

export function ResendVerification({ email }: Props) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (cooldown > 0 || status === "sending") return;
    setStatus("sending");

    const result = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/dashboard",
    });

    if (result.error) {
      setStatus("error");
    } else {
      setStatus("sent");
      setCooldown(COOLDOWN_SECONDS);
    }
  }, [email, cooldown, status]);

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        disabled={status === "sending" || cooldown > 0}
        onClick={handleResend}
        className="w-full h-12 border-border bg-paper hover:bg-canvas transition-all rounded-sm text-[11px] font-bold uppercase tracking-widest shadow-sm"
      >
        {status === "sending"
          ? "Sending..."
          : cooldown > 0
            ? `Resend in ${cooldown}s`
            : "Resend Verification Email"}
      </Button>

      {status === "sent" && (
        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-accent">
          ✓ New link sent — check your inbox
        </p>
      )}

      {status === "error" && (
        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-destructive">
          Failed to send — please try again
        </p>
      )}
    </div>
  );
}
