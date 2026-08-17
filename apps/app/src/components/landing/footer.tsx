"use client";

import { APP_CONFIG } from "@/config/app";
import Link from "next/link";
import React, { useState } from "react";
import { MessageSquare, ArrowRight, BookOpen, ChevronDown } from "lucide-react";
import { FiGithub, FiTwitter } from "react-icons/fi";
// ── Data ─────────────────────────────────────────────────────────────────────

const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Documentation", href: "/docs" },
    { label: "API Reference", href: "/docs/api" },
    { label: "Roadmap", href: "/roadmap" },
    { label: "Changelog", href: "/changelog" },
    { label: "Status", href: "/status" },
  ],
  Developers: [
    { label: "CLI", href: "/docs/cli" },
    { label: "TypeScript SDK", href: "/docs/sdk" },
    { label: "Next.js Integration", href: "/docs/nextjs" },
    { label: "REST API", href: "/docs/rest" },
    { label: "Webhooks", href: "/docs/webhooks" },
    { label: "Examples", href: "/examples" },
    { label: "GitHub", href: "https://github.com", external: true },
  ],
  Resources: [
    { label: "Blog", href: "/blog" },
    { label: "Guides", href: "/guides" },
    { label: "Templates", href: "/templates" },
    { label: "Use Cases", href: "/use-cases" },
    { label: "Community", href: "/community" },
    { label: "Support", href: "/support" },
    { label: "FAQ", href: "/faq" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Security", href: "/security" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/careers" },
  ],
};

const SOCIAL_LINKS = [
  { label: "GitHub", href: "https://github.com", icon: FiGithub },
  { label: "Twitter", href: "https://x.com", icon: FiTwitter },
  { label: "Discord", href: "https://discord.com", icon: MessageSquare },
];

const METADATA_CHIPS = ["Early Access", "Open Source", "MIT"];

// ── Sub-components ────────────────────────────────────────────────────────────

const FooterLink = ({ href, label, external }: { href: string; label: string; external?: boolean }) => (
  <Link
    href={href}
    target={external ? "_blank" : undefined}
    rel={external ? "noopener noreferrer" : undefined}
    className="group relative w-fit text-[13px] text-ink-muted hover:text-ink transition-colors duration-150 no-underline font-light leading-relaxed"
  >
    <span className="relative">
      {label}
      <span
        className="absolute -bottom-px left-0 w-0 h-px bg-accent group-hover:w-full transition-all duration-200"
        aria-hidden="true"
      />
    </span>
  </Link>
);

const MobileAccordion = ({ title, links }: { title: string; links: typeof FOOTER_LINKS.Product }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright"
        aria-expanded={open}
      >
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink">
          {title}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={1.5}
          className="text-ink-muted transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: open ? `${links.length * 36}px` : "0px" }}
      >
        <nav className="flex flex-col gap-3 pb-5" aria-label={title}>
          {links.map((link) => (
            <FooterLink key={link.label} {...link} />
          ))}
        </nav>
      </div>
    </div>
  );
};

// ── Main Footer ───────────────────────────────────────────────────────────────

const Footer = ({ session = null }: { session?: object | null }) => {
  const year = new Date().getFullYear();

  return (
    <footer
      className="bg-canvas border-t border-border"
      style={{
        backgroundColor: "#F5F2EC",
      }}
      aria-label="Site footer"
    >
      {/* ── CTA Band ── */}
      <div className="border-b border-border">
        <div
          className="max-w-[1200px] mx-auto px-8 py-16 md:py-20 flex flex-col md:flex-row md:items-center md:justify-between gap-10"
        >
          <div className="space-y-3 max-w-lg">
            <h2 className="font-display text-[28px] md:text-[36px] font-semibold text-black leading-tight tracking-tight"
              style={{ letterSpacing: "-0.02em" }}
            >
              Ready to ship content faster?
            </h2>
            <p className="text-base text-ink-muted dark:text-black/70 font-light leading-relaxed">
              Create your workspace and start building with{" "}
              <span className="font-medium text-black">{APP_CONFIG.name}</span> today.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            {/* Primary CTA */}
            {session ? (
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 no-underline px-5 py-2.5 font-ui font-medium text-[13px] uppercase tracking-[0.04em] text-black rounded-[2px] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright"
                style={{
                  background: "#CAFF4D",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#D6FF6A"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#CAFF4D"; }}
              >
                Go to Dashboard
                <ArrowRight
                  size={14}
                  strokeWidth={1.5}
                  className="transition-transform duration-150 group-hover:translate-x-0.5"
                />
              </Link>
            ) : (
              <Link
                href="/auth/register"
                className="group inline-flex items-center gap-2 no-underline px-5 py-2.5 font-ui font-medium text-[13px] uppercase tracking-[0.04em] text-black rounded-[2px] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright"
                style={{
                  background: "#CAFF4D",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#D6FF6A"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#CAFF4D"; }}
              >
                Get Started
                <ArrowRight
                  size={14}
                  strokeWidth={1.5}
                  className="transition-transform duration-150 group-hover:translate-x-0.5"
                />
              </Link>
            )}

            {/* Secondary CTA */}
            <Link
              href="/docs"
              className="group inline-flex items-center gap-2 no-underline px-5 py-2.5 font-ui font-medium text-[13px] uppercase tracking-[0.04em] text-black border border-border-strong rounded-[2px] transition-all duration-150 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright"
              style={{ background: "transparent" }}
            >
              <BookOpen size={13} strokeWidth={1.5} />
              Read Docs
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main Footer Content ── */}
      <div className="max-w-[1200px] mx-auto px-8 pt-16 pb-12">

        {/* Desktop: 5-col grid | hidden on mobile */}
        <div className="hidden md:grid md:grid-cols-5 gap-10 mb-16">

          {/* Brand col */}
          <div className="col-span-1 space-y-6">
            <Link
              href="/"
              className="font-display text-xl font-semibold text-black flex items-center gap-2.5 no-underline"
            >
              <div className="w-7 h-7 bg-sidebar rounded-[4px] flex items-center justify-center shrink-0">
                <div className="w-3 h-3 bg-accent-bright rounded-[1px]" />
              </div>
              {APP_CONFIG.name}
            </Link>

            <p className="text-[13px] text-ink-muted leading-loose font-light">
              Open-source headless CMS for developers who want predictable APIs and zero setup friction.
            </p>

            {/* Chips */}
            <div className="flex flex-wrap gap-1.5">
              {METADATA_CHIPS.map((chip) => (
                <span
                  key={chip}
                  className="font-mono text-[10px] px-2 py-0.5 rounded-[100px] border"
                  style={{
                    background: "rgba(78,124,89,0.07)",
                    borderColor: "rgba(78,124,89,0.25)",
                    color: "#4E7C59",
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>

            {/* Social */}
            <div className="flex items-center gap-3 pt-1">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="group flex items-center justify-center w-8 h-8 border border-border rounded-[2px] text-ink-muted hover:text-ink hover:border-border-strong transition-all duration-150 no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright"
                  style={{ background: "rgba(253,251,247,0.8)" }}
                >
                  <Icon
                    size={14}
                    strokeWidth={1.5}
                    className="transition-transform duration-150 group-hover:-translate-y-px group-hover:rotate-3"
                  />
                </Link>
              ))}
            </div>
          </div>

          {/* Link cols */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section} className="col-span-1 space-y-5">
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">
                {section}
              </h3>
              <nav className="flex flex-col gap-2.5" aria-label={section}>
                {links.map((link) => (
                  <FooterLink key={link.label} {...link} />
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Mobile: brand + accordions */}
        <div className="md:hidden space-y-8 mb-10">
          {/* Brand */}
          <div className="space-y-5">
            <Link
              href="/"
              className="font-display text-xl font-semibold text-ink flex items-center gap-2.5 no-underline"
            >
              <div className="w-7 h-7 bg-sidebar rounded-[4px] flex items-center justify-center shrink-0">
                <div className="w-3 h-3 bg-accent-bright rounded-[1px]" />
              </div>
              {APP_CONFIG.name}
            </Link>
            <p className="text-[13px] text-ink-muted leading-loose font-light">
              Open-source headless CMS for developers who want predictable APIs and zero setup friction.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {METADATA_CHIPS.map((chip) => (
                <span
                  key={chip}
                  className="font-mono text-[10px] px-2 py-0.5 rounded-[100px] border"
                  style={{
                    background: "rgba(78,124,89,0.07)",
                    borderColor: "rgba(78,124,89,0.25)",
                    color: "#4E7C59",
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="group flex items-center justify-center w-9 h-9 border border-border rounded-[2px] text-ink-muted hover:text-ink transition-all duration-150 no-underline"
                >
                  <Icon size={15} strokeWidth={1.5} />
                </Link>
              ))}
            </div>
          </div>

          {/* Accordion nav */}
          <div className="border-t border-border">
            {Object.entries(FOOTER_LINKS).map(([section, links]) => (
              <MobileAccordion key={section} title={section} links={links} />
            ))}
          </div>
        </div>

        {/* ── Bottom Strip ── */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          {/* Copyright */}
          <p className="font-mono text-[11px] text-ink-faint uppercase tracking-[0.1em]">
            © {year} {APP_CONFIG.name}. All rights reserved.
          </p>

          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <span
              className="relative flex h-2 w-2"
              aria-label="System status: operational"
            >
              <span
                className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping"
                style={{ background: "#3A7D44", animationDuration: "2.5s" }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ background: "#3A7D44" }}
              />
            </span>
            <span className="font-mono text-[11px] text-ink-faint uppercase tracking-[0.08em]">
              All systems operational
            </span>
          </div>

          {/* Legal links */}
          <div className="flex items-center gap-5">
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Cookies", href: "/cookies" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="font-mono text-[11px] text-ink-faint hover:text-ink-muted uppercase tracking-[0.08em] transition-colors duration-150 no-underline"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;