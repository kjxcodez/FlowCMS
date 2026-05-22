"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import Image from "next/image";
import { APP_CONFIG } from "@/config/app";
import { NavLinks } from "./NavLinks";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { NavCTA } from "./NavCTA";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  session?: object | null;
  /**
   * "all"   — full overlay: links + theme + CTA  (< md)
   * "links" — links-only drawer                  (md → lg)
   */
  mode?: "all" | "links";
}

export const MobileNav = ({
  isOpen,
  onClose,
  session,
  mode = "all",
}: MobileNavProps) => {
  const isLinksOnly = mode === "links";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[99] bg-ink/30 dark:bg-ink/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            className={cn(
              "fixed z-[100] bg-paper dark:bg-canvas flex flex-col overflow-y-auto",
              isLinksOnly
                // Links-only: right-side drawer, not full screen
                ? "top-0 right-0 bottom-0 w-72 p-6 shadow-xl"
                // Full overlay for mobile
                : "inset-0 p-8",
            )}
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={isLinksOnly ? "Navigation menu" : "Mobile navigation menu"}
          >
            {/* Header row */}
            <div className="flex justify-between items-center mb-6">
              {!isLinksOnly && (
                <Image
                  src="/full-logo.png"
                  alt={APP_CONFIG.name}
                  width={160}
                  height={40}
                  unoptimized
                />
              )}

              {isLinksOnly && (
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">
                  Navigation
                </p>
              )}

              <motion.button
                className="bg-transparent border border-border rounded-sm p-2 text-ink cursor-pointer ml-auto"
                onClick={onClose}
                aria-label="Close menu"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X size={18} strokeWidth={1.5} />
              </motion.button>
            </div>

            {/* Nav links */}
            <NavLinks mobile onLinkClick={onClose} />

            {/* Bottom controls — only in "all" mode */}
            {!isLinksOnly && (
              <div className="flex flex-col gap-8 mt-auto pt-12">
                <div className="flex flex-col gap-3">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">
                    Appearance
                  </p>
                  <ThemeSwitcher variant="expanded" />
                </div>
                <NavCTA session={session} fullWidth onAction={onClose} />
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};