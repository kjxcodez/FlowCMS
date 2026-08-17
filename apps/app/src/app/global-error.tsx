"use client";

import { useEffect } from "react";
import { APP_CONFIG } from "@/config/app";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError] Uncaught error boundary exception:", error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center bg-canvas p-4 text-center">
        <div className="max-w-md space-y-8">
          <div className="space-y-4">
            <h1 className="font-display text-5xl font-semibold tracking-tight text-ink">
              System <em className="italic text-accent not-italic">Error</em>
            </h1>
            <p className="text-ink-muted text-sm leading-relaxed font-light">
              An unexpected application error has occurred.
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            <Button
              onClick={() => reset()}
              className="h-12 bg-sidebar text-white font-sans font-bold text-[11px] uppercase tracking-[0.2em] rounded-sm hover:opacity-95 transition-all"
            >
              Attempt Recovery
            </Button>
            <Button
              variant="outline"
              asChild
              className="h-12 border-border bg-paper text-ink-muted font-sans font-bold text-[11px] uppercase tracking-[0.2em] rounded-sm hover:bg-canvas transition-all"
            >
              <Link href="/">Return to Home</Link>
            </Button>
          </div>

          <div className="pt-8 border-t border-border">
            <p className="text-[10px] font-mono text-ink-faint uppercase tracking-widest">
              &copy; {new Date().getFullYear()} {APP_CONFIG.name} Engineering
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
