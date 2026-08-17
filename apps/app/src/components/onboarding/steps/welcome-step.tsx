"use client";

import React from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Sparkles, Terminal } from "lucide-react";

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center space-y-12">
      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mx-auto w-20 h-20 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shadow-[0_0_50px_rgba(var(--accent-rgb),0.15)]"
        >
          <Sparkles className="size-8 text-accent animate-pulse" />
        </motion.div>
        
        <div className="space-y-3">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="font-display text-5xl font-semibold text-white tracking-tight"
          >
            The <em className="italic text-accent not-italic">Initiation</em>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-white/40 text-lg font-light max-w-lg mx-auto leading-relaxed"
          >
            Welcome, Operator. Your orchestration layer is ready for initialization.
          </motion.p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="flex flex-col items-center gap-6"
      >
        <Button 
          onClick={onNext}
          size="lg" 
          className="h-14 px-10 text-[11px] font-bold uppercase tracking-[0.3em] rounded-full bg-white text-sidebar hover:bg-accent hover:text-white transition-all shadow-2xl group"
        >
          Begin Sync
          <Terminal className="size-4 ml-3 opacity-50 group-hover:opacity-100 transition-opacity" />
        </Button>
        
        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white/20">
          Neural link established • encryption active
        </p>
      </motion.div>
    </div>
  );
}
