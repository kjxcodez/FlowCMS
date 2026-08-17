"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app";

const FadeUp = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
  >
    {children}
  </motion.div>
);

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-canvas px-6">
      {/* Background glow — reddish tint for error state */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-[480px] w-[480px] rounded-full bg-destructive/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        {/* Large 500 */}
        <FadeUp delay={0}>
          <span
            className="select-none font-display text-[clamp(7rem,18vw,14rem)] font-bold leading-none tracking-tight text-ink/8"
            aria-hidden
          >
            500
          </span>
        </FadeUp>

        {/* Headline */}
        <FadeUp delay={0.08}>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
            Something went wrong
          </h1>
        </FadeUp>

        {/* Description */}
        <FadeUp delay={0.14}>
          <p className="max-w-sm text-base text-ink-muted">
            An unexpected error occurred. You can try again, or head back to{" "}
            {APP_CONFIG.name} if the problem persists.
          </p>
        </FadeUp>

        {/* Error digest (if available) */}
        {error.digest && (
          <FadeUp delay={0.18}>
            <p className="font-mono text-xs text-ink-faint">
              Error ID: {error.digest}
            </p>
          </FadeUp>
        )}

        {/* CTAs */}
        <FadeUp delay={0.22}>
          <div className="mt-2 flex items-center gap-3">
            <Button size="lg" onClick={reset}>
              Try again
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </FadeUp>

        {/* Subtle branding */}
        <FadeUp delay={0.3}>
          <p className="font-mono text-xs text-ink-faint">
            {APP_CONFIG.name} · error 500
          </p>
        </FadeUp>
      </div>
    </div>
  );
}
