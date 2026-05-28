import type { Metadata } from "next";
import { APP_CONFIG } from "@/config/app";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_CONFIG.name}`,
    default: APP_CONFIG.name,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--canvas)] overflow-hidden max-h-dvh">
      {/* --- Left Panel: Editorial-Industrial Dark --- */}
      <div className="hidden md:flex md:w-[45%] bg-[var(--sidebar)] flex-col justify-between p-12 text-white relative overflow-hidden">
        {/* Subtle background pattern */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 no-underline group">
            <Link
              href="/"
              className="font-display text-xl font-semibold text-ink flex items-center gap-3 no-underline group"
              aria-label={`${APP_CONFIG.name} home`}
            >
              <Image
                src="/full-logo.png"
                alt="FlowCms"
                width={200}
                height={200}
                unoptimized
                className="invert hue-rotate-180"
              />
            </Link>
          </Link>
        </div>

        <div className="relative z-10 max-w-sm">
          <h2 className="font-display text-3xl font-medium leading-tight mb-6">
            Content <em>orchestration</em> for high-performance teams.
          </h2>
          <p className="text-[var(--ink-muted)] text-sm leading-relaxed">
            The industrial-strength headless CMS that puts developers in control
            and gives editors a clean, focused workspace.
          </p>
        </div>

        <div className="relative z-10 text-[var(--ink-muted)] font-mono text-[10px] uppercase tracking-widest">
          &copy; {new Date().getFullYear()} {APP_CONFIG.name} / Built for Flow
        </div>
      </div>

      {/* --- Right Panel: Ivory/Paper Form --- */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[var(--paper)] max-h-dvh min-h-dvh overflow-y-auto py-12 scroll-py-12">
        <div className="w-full max-w-[400px] h-full">
          {/* Mobile Logo */}
          <div className="md:hidden flex justify-center mb-12">
            <Link href="/" className="flex items-center gap-3">
              <Link
                href="/"
                className="font-display text-xl font-semibold text-ink flex items-center gap-3 no-underline group"
                aria-label={`${APP_CONFIG.name} home`}
              >
                <Image
                  src="/full-logo.png"
                  alt="FlowCms"
                  width={200}
                  height={200}
                  unoptimized
                />
              </Link>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
