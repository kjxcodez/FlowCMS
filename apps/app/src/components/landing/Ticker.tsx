"use client";

import React from "react";
import { APP_CONFIG } from "@/config/app";

export const Ticker = () => {
  const items = APP_CONFIG.tickerItems;
  return (
    <div 
      className="overflow-hidden border-y border-border bg-paper py-3.5 group cursor-default" 
      role="region" 
      aria-label={`FlowCMS features: ${items.join(", ")}`}
    >
      <div
        className="flex whitespace-nowrap animate-ticker group-hover:[animation-play-state:paused]"
      >
        {[...items, ...items].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2.5 px-7 font-mono text-[11px] text-ink-muted tracking-wide uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-bright shrink-0 shadow-[0_0_8px_rgba(202,255,77,0.5)]" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};
