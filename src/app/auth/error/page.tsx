"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Mail, MessageSquare, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || searchParams.get("error");

  const errorDetails = {
    INVITE_REQUIRED: {
      title: "Invite Required",
      message: "You need a valid invitation to register for FlowCMS during early access.",
      icon: <ShieldAlert className="w-12 h-12 text-destructive" />,
    },
    INVITE_INVALID: {
      title: "Invalid Invite",
      message: "The invitation link you followed is invalid or has already been used.",
      icon: <ShieldAlert className="w-12 h-12 text-destructive" />,
    },
    INVITE_EXPIRED: {
      title: "Invite Expired",
      message: "This invitation has expired. Invitations are typically valid for 7 days.",
      icon: <AlertCircle className="w-12 h-12 text-warning" />,
    },
    INVITE_MISSING: {
      title: "Broken Link",
      message: "The registration link is missing required security tokens.",
      icon: <AlertCircle className="w-12 h-12 text-ink-muted" />,
    },
    unable_to_create_user: {
      title: "Signup Failed",
      message: "We couldn't create your account. This usually happens if the invite was revoked or a session already exists.",
      icon: <ShieldAlert className="w-12 h-12 text-destructive" />,
    },
  };

  const currentError = errorDetails[code as keyof typeof errorDetails] || {
    title: "Authentication Error",
    message: "Something went wrong during the authentication process. Please try again.",
    icon: <AlertCircle className="w-12 h-12 text-destructive" />,
  };

  return (
    <div className="min-h-screen ruled-bg flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-paper border border-border p-8 shadow-lg relative noise-overlay">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="p-4 bg-canvas border border-border">
            {currentError.icon}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-display font-semibold text-ink tracking-tight">
              {currentError.title}
            </h1>
            <p className="text-base text-ink-muted leading-relaxed">
              {currentError.message}
            </p>
          </div>

          <div className="w-full h-px bg-border-strong my-2" />

          <div className="w-full flex flex-col gap-3">
            <Button asChild className="w-full bg-accent-bright hover:bg-[#D6FF6A] text-ink font-sans font-medium uppercase tracking-widest text-xs h-12 border-none">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Waitlist
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full border-border-strong text-ink hover:border-accent hover:text-accent font-sans font-medium uppercase tracking-widest text-xs h-12">
              <Link href="mailto:support@getflowcms.com">
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Link>
            </Button>
          </div>

          <div className="pt-4 flex items-center gap-2 text-xs text-ink-faint font-mono uppercase tracking-widest">
            <MessageSquare className="w-3 h-3" />
            <span>Error Code: {code || "UNKNOWN"}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center space-y-4">
        <p className="text-xs text-ink-muted font-sans uppercase tracking-[0.2em]">
          FlowCMS / Meridian Infrastructure
        </p>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen ruled-bg" />}>
      <AuthErrorContent />
    </Suspense>
  );
}
