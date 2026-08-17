import React from "react";
import { requireVerifiedSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireVerifiedSession();
  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 graph-bg opacity-10" />
      <div className="absolute inset-0 noise-overlay opacity-20" />
      
      {/* Flow Particles Placeholder (will be added in components) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      
      <main className="relative z-10 w-full max-w-4xl px-6">
        {children}
      </main>
      
      {/* Footer Branding */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 opacity-30 select-none">
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-white">System: FlowCMS</span>
        <div className="w-1 h-1 rounded-full bg-accent animate-pulse" />
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-white">Status: Initializing</span>
      </div>
    </div>
  );
}
