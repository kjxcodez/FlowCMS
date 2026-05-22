"use client";

import { MenuIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { APP_CONFIG } from "@/config/app";
import { cn } from "@/lib/utils";

import { NavLinks } from "./NavLinks";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { NavCTA } from "./NavCTA";
import { MobileNav } from "./MobileNav";

interface NavbarProps {
  session?: object | null;
}

export const Navbar = ({ session = null }: NavbarProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  // "links" = md-to-lg hamburger (links only), "all" = <md hamburger (everything)
  const [mobileOpen, setMobileOpen] = useState<"links" | "all" | false>(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <motion.header
        role="banner"
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-paper/88 backdrop-blur-md border-b border-border shadow-sm dark:bg-canvas/88"
            : "bg-transparent",
        )}
      >
        <div className="max-w-[1200px] mx-auto px-6 md:px-8 h-16 flex items-center justify-between gap-6">

          {/* Logo */}
          <Link
            href="/"
            aria-label={`${APP_CONFIG.name} home`}
            className="flex-shrink-0 no-underline"
          >
            <motion.div whileHover={{ opacity: 0.85 }} transition={{ duration: 0.15 }}>
              <Image
                src="/full-logo.png"
                alt={APP_CONFIG.name}
                width={160}
                height={40}
                priority
                unoptimized
              />
            </motion.div>
          </Link>

          {/* Desktop nav links — lg+ only */}
          <NavLinks />

          {/* Right-side controls */}
          <div className="flex items-center gap-3">

            {/* Theme switcher — visible on md+ */}
            {mounted && (
              <motion.div
                className="hidden md:flex"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                <ThemeSwitcher variant="compact" />
              </motion.div>
            )}

            {/* CTA — visible on md+ */}
            <div className="hidden md:flex">
              <NavCTA session={session} />
            </div>

            {/* Hamburger for nav-links only — md to lg */}
            <motion.button
              className="hidden md:flex lg:hidden bg-transparent border border-border rounded-sm p-2 text-ink cursor-pointer"
              onClick={() => setMobileOpen("links")}
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen === "links"}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
            >
              <MenuIcon size={18} strokeWidth={1.5} />
            </motion.button>

            {/* Hamburger for everything — below md */}
            <motion.button
              className="flex md:hidden bg-transparent border border-border rounded-sm p-2 text-ink cursor-pointer"
              onClick={() => setMobileOpen("all")}
              aria-label="Open menu"
              aria-expanded={mobileOpen === "all"}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
            >
              <MenuIcon size={18} strokeWidth={1.5} />
            </motion.button>
          </div>
        </div>

        {scrolled && (
          <motion.div
            className="absolute bottom-0 left-0 h-[2px] bg-accent-bright/60"
            style={{ width: "100%" }}
            layoutId="scroll-line"
          />
        )}
      </motion.header>

      {/* Mobile nav — "all" mode (< md): links + theme + CTA */}
      <MobileNav
        isOpen={mobileOpen === "all"}
        onClose={() => setMobileOpen(false)}
        session={session}
        mode="all"
      />

      {/* Links-only drawer — "links" mode (md to lg) */}
      <MobileNav
        isOpen={mobileOpen === "links"}
        onClose={() => setMobileOpen(false)}
        session={session}
        mode="links"
      />
    </>
  );
};

export default Navbar;