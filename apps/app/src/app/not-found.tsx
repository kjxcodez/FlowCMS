"use client";

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

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-canvas px-6">
      {/* Background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-[480px] w-[480px] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        {/* Large 404 */}
        <FadeUp delay={0}>
          <span
            className="select-none font-display text-[clamp(7rem,18vw,14rem)] font-bold leading-none tracking-tight text-ink/8"
            aria-hidden
          >
            404
          </span>
        </FadeUp>

        {/* Headline */}
        <FadeUp delay={0.08}>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
            Page not found
          </h1>
        </FadeUp>

        {/* Description */}
        <FadeUp delay={0.14}>
          <p className="max-w-sm text-base text-ink-muted">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. Head back to {APP_CONFIG.name} and pick up where you left
            off.
          </p>
        </FadeUp>

        {/* CTA */}
        <FadeUp delay={0.2}>
          <div className="mt-2 flex items-center gap-3">
            <Button asChild size="lg">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/">Back Home</Link>
            </Button>
          </div>
        </FadeUp>

        {/* Subtle branding */}
        <FadeUp delay={0.28}>
          <p className="font-mono text-xs text-ink-faint">
            {APP_CONFIG.name} · error 404
          </p>
        </FadeUp>
      </div>
    </div>
  );
}
