"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_CONFIG } from "@/config/app";
import { cn } from "@/lib/utils";

interface NavLinksProps {
  /** When true, renders the mobile (vertical) layout */
  mobile?: boolean;
  onLinkClick?: () => void;
}

export const NavLinks = ({ mobile = false, onLinkClick }: NavLinksProps) => {
  const pathname = usePathname();

  if (mobile) {
    return (
      <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
        {APP_CONFIG.nav.map((link, linkIndex) => {
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onLinkClick}
              className={cn(
                "group relative flex items-center gap-4 no-underline py-2",
                isActive ? "text-ink" : "text-ink/70",
              )}
            >
              {/* Staggered character animation */}
              <span
                className="font-display text-3xl font-bold leading-none tracking-tight"
                aria-hidden="true"
              >
                {link.label.split("").map((char, charIndex) => (
                  <motion.span
                    key={charIndex}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.45,
                      delay: 0.08 + linkIndex * 0.07 + charIndex * 0.018,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="inline-block"
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </span>

              {/* Screen-reader accessible label */}
              <span className="sr-only">{link.label}</span>

              {/* Animated rule line */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{
                  delay: 0.2 + linkIndex * 0.07 + link.label.length * 0.018,
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{ originX: 0 }}
                className="hidden sm:block h-px flex-1 bg-border-strong/40"
              />

              {/* Active indicator */}
              {isActive && (
                <motion.span
                  layoutId="mobile-active-dot"
                  className="w-2 h-2 rounded-full bg-accent-bright flex-shrink-0"
                />
              )}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
      {APP_CONFIG.nav.map((link) => {
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "relative text-[11px] font-medium no-underline px-4 py-2 rounded-sm",
              "transition-colors duration-100 uppercase tracking-widest",
              "hover:text-ink hover:bg-black/5 dark:hover:bg-white/5",
              isActive ? "text-ink" : "text-ink-muted",
            )}
          >
            {link.label}

            {/* Active underline indicator */}
            {isActive && (
              <motion.span
                layoutId="desktop-nav-indicator"
                className="absolute bottom-0 left-3 right-3 h-[2px] bg-accent-bright"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
};