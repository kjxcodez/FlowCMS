"use client";

import React from "react";
import { motion } from "motion/react";
import { APP_CONFIG } from "@/config/app";

export const Ticker = () => {
  const items = APP_CONFIG.tickerItems;
  return (
    <div 
      className="overflow-hidden border-y border-border bg-paper py-3.5" 
      role="region" 
      aria-label={`FlowCMS features: ${items.join(", ")}`}
    >
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        {[...items, ...items].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2.5 px-7 font-mono text-[11px] text-ink-muted tracking-wide uppercase">
            <span className="h-1 w-1 rounded-full bg-accent-bright shrink-0" />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
};
