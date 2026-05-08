"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { Sparkles, Terminal, ShieldCheck, Activity } from "lucide-react";

export function DeploymentStep({ data }: { data: any }) {
  const router = useRouter();
  const [status, setStatus] = useState(0);
  const messages = [
    "Compiling orchestration logic...",
    "Syncing neural identifiers...",
    "Deploying blueprint: " + data.firstSchemaName,
    "Initializing workspace: " + data.workspaceName,
    "Establishing secure uplink...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(s => {
        if (s < messages.length - 1) return s + 1;
        return s;
      });
    }, 1200);

    // Final completion logic
    const completeOnboarding = async () => {
      try {
        // We'll call an internal API to mark as onboarded
        await fetch("/api/internal/onboarding/complete", { 
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        
        setTimeout(() => {
          router.push("/dashboard");
        }, 8000); // Give them time to soak in the "Deployment"
      } catch (err) {
        console.error(err);
      }
    };

    completeOnboarding();
    return () => clearInterval(interval);
  }, [data, messages.length, router]);

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[400px] space-y-12">
      {/* Animated Core */}
      <div className="relative">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="size-48 rounded-full border-2 border-dashed border-accent/20 flex items-center justify-center"
        >
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="size-32 rounded-full border border-accent/40 flex items-center justify-center bg-accent/5 shadow-[0_0_80px_rgba(var(--accent-rgb),0.1)]"
          >
             <Activity className="size-8 text-accent animate-pulse" />
          </motion.div>
        </motion.div>
        
        {/* Orbiting particles */}
        {[0, 90, 180, 270].map((angle, i) => (
          <motion.div
            key={i}
            animate={{ 
              rotate: [angle, angle + 360],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 4, delay: i * 0.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56"
          >
            <div className="size-2 rounded-full bg-accent shadow-[0_0_10px_#22c55e]" />
          </motion.div>
        ))}
      </div>

      <div className="w-full space-y-8">
        <div className="space-y-4 text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={status}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-[11px] font-mono font-bold uppercase tracking-[0.4em] text-accent"
            >
              {messages[status]}
            </motion.p>
          </AnimatePresence>
          
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 8, ease: "easeInOut" }}
              className="h-full bg-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]"
            />
          </div>
        </div>

        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-sm font-mono text-[9px] text-white/20 space-y-2 uppercase tracking-widest overflow-hidden h-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-sidebar z-10" />
          {[...Array(12)].map((_, i) => (
            <p key={i} className="opacity-40 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
              [{new Date().toLocaleTimeString()}] SYS_INIT::{Math.random().toString(36).substring(7)}::NODE_{i} ACTIVE
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
