"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { SystemIcon } from "./LandingIcons";

interface ThemeSwitcherProps {
  /** "compact" = icon-only pills (desktop navbar), "expanded" = icon + label (mobile) */
  variant?: "compact" | "expanded";
}

const THEME_OPTIONS = [
  { key: "light", label: "Light", icon: <SunIcon className="size-4" /> },
  { key: "dark", label: "Dark", icon: <MoonIcon className="size-4" /> },
  { key: "system", label: "System", icon: <SystemIcon className="size-4" /> },
] as const;

export const ThemeSwitcher = ({ variant = "compact" }: ThemeSwitcherProps) => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        "flex items-center bg-black/5 dark:bg-white/5 border border-border rounded-sm p-1 gap-1",
        variant === "expanded" ? "w-fit" : "",
      )}
      role="group"
      aria-label="Select color theme"
    >
      {THEME_OPTIONS.map((opt) => {
        const isActive = theme === opt.key;

        return (
          <button
            key={opt.key}
            onClick={() => setTheme(opt.key)}
            aria-label={`${opt.label} theme`}
            aria-pressed={isActive}
            title={opt.label}
            className={cn(
              "relative flex items-center justify-center gap-2 border-none bg-transparent",
              "text-ink-muted cursor-pointer rounded-sm transition-colors duration-100",
              variant === "compact" ? "w-7 h-7" : "px-4 py-2 text-xs font-medium uppercase tracking-wider",
              isActive && "text-ink dark:text-white",
            )}
          >
            {/* Sliding active background */}
            {isActive && (
              <motion.span
                layoutId={`theme-pill-${variant}`}
                className="absolute inset-0 rounded-sm bg-paper shadow-sm dark:bg-sidebar-mid"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}

            <span className="relative z-10 flex items-center gap-2">
              {opt.icon}
              {variant === "expanded" && opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};