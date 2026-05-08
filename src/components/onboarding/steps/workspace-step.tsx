"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, ArrowRight } from "lucide-react";

export function WorkspaceStep({ onNext }: { onNext: (name: string) => void }) {
  const [name, setName] = useState("");

  return (
    <div className="max-w-xl mx-auto space-y-12">
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-accent font-mono text-[10px] font-bold uppercase tracking-[0.3em]">
          <Globe className="size-4" />
          Protocol 01: Identification
        </div>
        <h2 className="font-display text-4xl font-semibold text-white">
          Identify your <em className="italic text-accent not-italic">command</em> center.
        </h2>
        <p className="text-white/40 font-light leading-relaxed">
          Every operator needs a designated workspace. This will be the unique namespace for your content architecture.
        </p>
      </div>

      <div className="space-y-8">
        <div className="relative group">
          <Input 
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Project Orion"
            className="h-16 bg-white/5 border-white/10 rounded-sm text-xl px-6 text-white placeholder:text-white/10 focus:border-accent/50 focus:ring-accent/10 transition-all"
          />
          <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
        </div>

        <Button 
          disabled={!name.trim()}
          onClick={() => onNext(name)}
          className="w-full h-14 text-[11px] font-bold uppercase tracking-[0.3em] rounded-sm bg-accent text-white hover:opacity-90 disabled:opacity-30 transition-all shadow-xl"
        >
          Confirm Designation
          <ArrowRight className="size-4 ml-3" />
        </Button>
      </div>
    </div>
  );
}
