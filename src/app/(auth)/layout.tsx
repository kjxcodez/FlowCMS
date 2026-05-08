import type { Metadata } from "next";
import { APP_CONFIG } from "@/config/app";
import Link from "next/link";

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
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--canvas)]">
      {/* --- Left Panel: Editorial-Industrial Dark --- */}
      <div className="hidden md:flex md:w-[45%] bg-[var(--sidebar)] flex-col justify-between p-12 text-white relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
        />
        
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 no-underline group">
            <div className="w-8 h-8 bg-[var(--accent-bright)] rounded flex items-center justify-center transition-transform group-hover:scale-105">
              <div className="w-3 h-3 bg-[var(--sidebar)] rounded-[1px]" />
            </div>
            <span className="font-display text-xl font-semibold tracking-tight text-[var(--ink)] text-white">
              {APP_CONFIG.name}
            </span>
          </Link>
        </div>

        <div className="relative z-10 max-w-sm">
          <h2 className="font-display text-3xl font-medium leading-tight mb-6">
            Content <em>orchestration</em> for high-performance teams.
          </h2>
          <p className="text-[var(--ink-muted)] text-sm leading-relaxed">
            The industrial-strength headless CMS that puts developers in control and gives editors a clean, focused workspace.
          </p>
        </div>

        <div className="relative z-10 text-[var(--ink-muted)] font-mono text-[10px] uppercase tracking-widest">
          &copy; {new Date().getFullYear()} {APP_CONFIG.name} / Built for Flow
        </div>
      </div>

      {/* --- Right Panel: Ivory/Paper Form --- */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[var(--paper)]">
        <div className="w-full max-w-[400px]">
          {/* Mobile Logo */}
          <div className="md:hidden flex justify-center mb-12">
             <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[var(--sidebar)] rounded flex items-center justify-center">
                <div className="w-3 h-3 bg-[var(--accent-bright)] rounded-[1px]" />
              </div>
              <span className="font-display text-xl font-semibold tracking-tight text-[var(--ink)]">
                {APP_CONFIG.name}
              </span>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
