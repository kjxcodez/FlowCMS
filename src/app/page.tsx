"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import { 
  motion, 
  useScroll, 
  useTransform, 
  useInView, 
  AnimatePresence, 
  useMotionValue, 
  animate 
} from "motion/react";
import { APP_CONFIG } from "@/config/app";
import { 
  SunIcon, 
  MoonIcon, 
  SystemIcon, 
  MenuIcon, 
  CloseIcon, 
  ArrowRightIcon, 
  CheckIcon 
} from "@/components/landing/LandingIcons";
import { 
  LayoutGridIcon, 
  FileTextIcon, 
  CodeIcon, 
  DatabaseIcon, 
  GlobeIcon, 
  ShieldCheckIcon,
  ZapIcon,
  SearchIcon,
  Share2Icon,
  TerminalIcon,
  CpuIcon,
  WorkflowIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { LiveDemo } from "@/components/landing/LiveDemo";
import { Ticker } from "@/components/landing/Ticker";
import { UseCases } from "@/components/landing/UseCases";
import { Comparison } from "@/components/landing/Comparison";
import { FAQ, FAQS } from "@/components/landing/FAQ";
import { isWaitlistMode } from "@/lib/launch";
import { WaitlistForm } from "@/components/landing/WaitlistForm";

// --- Counter animation component ---
const Counter = ({ value }: { value: number }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      animate(count, value, { duration: 2, ease: [0.16, 1, 0.3, 1] });
    }
  }, [inView, count, value]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
};

// --- Staggered fade-up animation wrapper ---
const FadeUp = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};

// --- Directional fade animation wrapper ---
const DirectionalFade = ({ children, delay = 0, index, className = "" }: { children: React.ReactNode; delay?: number; index: number; className?: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  
  const column = index % 3; // 0=left, 1=middle, 2=right
  
  const initial = {
    opacity: 0,
    x: column === 0 ? -40 : column === 2 ? 40 : 0,
    y: column === 1 ? 40 : 0
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initial}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : initial}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};

const FEATURE_LIST = [
  { num: "01", icon: <LayoutGridIcon />, title: "Visual Block Builder", desc: "Craft editorial experiences without code. Every block maps 1:1 to structured JSON." },
  { num: "02", icon: <FileTextIcon />, title: "Dynamic Schemas", desc: "Define fields and validations visually. Zero migrations, zero configuration required." },
  { num: "03", icon: <GlobeIcon />, title: "Edge Native", desc: "Global content delivery with sub-50ms latency. No cold starts, no overhead." },
  { num: "04", icon: <DatabaseIcon />, title: "Content Versioning", desc: "Infinite history and atomic rollbacks. Never lose a draft or break a production release." },
  { num: "05", icon: <ShieldCheckIcon />, title: "Enterprise RBAC", desc: "Granular permissions for teams. Separate editorial power from administrative control." },
  { num: "06", icon: <CodeIcon />, title: "Universal API", desc: "Query via REST or GraphQL. Type-safe outputs for Next.js, Remix, and native apps." }
];

const COMING_SOON = [
  { title: "Visual Comparison", desc: "Side-by-side diffing for content versions." },
  { title: "Native DAM", desc: "Integrated digital asset management with AI tagging." },
  { title: "Webhooks V2", desc: "Durable event triggers with automatic retries." },
  { title: "SDK Generator", desc: "One-click generation of type-safe clients." }
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  
  const session = null; // Mock session for now

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const themeOptions = [
    { key: "light", label: "Light", icon: <SunIcon className="size-4" /> },
    { key: "dark", label: "Dark", icon: <MoonIcon className="size-4" /> },
    { key: "system", label: "System", icon: <SystemIcon className="size-4" /> },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQS.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className="min-h-screen bg-canvas text-ink selection:bg-accent-bright/30">
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* --- HEADER --- */}
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled ? "bg-paper/88 backdrop-blur-md border-b border-border shadow-sm dark:bg-canvas/88" : "bg-transparent"
        )} 
        role="banner"
      >
        <div className="max-w-[1200px] mx-auto px-8 h-[64px] flex items-center justify-between">
          <Link href="/" className="font-display text-xl font-semibold text-ink flex items-center gap-3 no-underline group" aria-label={`${APP_CONFIG.name} home`}>
            <div className="w-8 h-8 bg-sidebar rounded-[4px] flex items-center justify-center transition-transform group-hover:scale-105" aria-hidden="true">
              <div className="w-3.5 h-3.5 bg-accent-bright rounded-[1px]" />
            </div>
            {APP_CONFIG.name}
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {APP_CONFIG.nav.map(link => (
              <Link 
                key={link.href} 
                href={link.href}
                className="text-[12px] font-medium text-ink-muted no-underline px-4 py-2 rounded-sm transition-all hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 uppercase tracking-widest"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            {mounted && (
              <div className="hidden md:flex items-center bg-black/5 dark:bg-white/5 border border-border rounded-sm p-1 gap-1" role="group" aria-label="Select color theme">
                {themeOptions.map(opt => (
                  <button
                    key={opt.key}
                    className={cn(
                      "flex items-center justify-center w-7 h-7 border-none bg-transparent text-ink-muted cursor-pointer rounded-sm transition-all",
                      theme === opt.key && "bg-paper text-ink shadow-sm dark:bg-sidebar-mid dark:text-white"
                    )}
                    onClick={() => setTheme(opt.key)}
                    aria-label={`${opt.label} theme`}
                    aria-pressed={theme === opt.key}
                    title={opt.label}
                  >
                    {opt.icon}
                  </button>
                ))}
              </div>
            )}
            {session ? (
              <Button asChild className="rounded-sm px-6 h-10 text-[11px] font-bold uppercase tracking-[0.15em]">
                <Link href="/dashboard">
                  Dashboard <ArrowRightIcon className="ml-2 size-3.5" />
                </Link>
              </Button>
            ) : isWaitlistMode ? (
                <Button asChild className="rounded-sm px-6 h-10 text-[11px] font-bold uppercase tracking-[0.15em]">
                  <Link href="#waitlist-form">
                    Join Waitlist <ArrowRightIcon className="ml-2 size-3.5" />
                  </Link>
                </Button>
            ) : (
              <>
                <Link href="/login" className="hidden lg:flex text-[11px] font-bold uppercase tracking-[0.15em] text-ink-muted hover:text-ink no-underline px-4 py-2 transition-colors">
                  Sign in
                </Link>
                <Button asChild className="rounded-sm px-6 h-10 text-[11px] font-bold uppercase tracking-[0.15em]">
                  <Link href="/register">
                    Get started <ArrowRightIcon className="ml-2 size-3.5" />
                  </Link>
                </Button>
              </>
            )}
            <button
              className="md:hidden bg-transparent border-none text-ink cursor-pointer p-1.5"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      {/* --- MOBILE NAV --- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-[100] bg-paper flex flex-col p-8 dark:bg-canvas"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex justify-between items-center mb-16">
              <span className="font-display text-2xl font-semibold text-ink flex items-center gap-3">
                <div className="w-8 h-8 bg-sidebar rounded-[4px] flex items-center justify-center">
                  <div className="w-3.5 h-3.5 bg-accent-bright rounded-[1px]" />
                </div>
                {APP_CONFIG.name}
              </span>
              <button className="bg-transparent border-none text-ink p-2" onClick={() => setMobileMenuOpen(false)}>
                <CloseIcon />
              </button>
            </div>
            <nav className="flex flex-col gap-2">
              {APP_CONFIG.nav.map((link, linkIndex) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-display text-5xl font-bold text-ink no-underline py-3 group flex items-center gap-4"
                >
                  <div className="flex">
                    {link.label.split("").map((char, charIndex) => (
                      <motion.span
                        key={charIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          duration: 0.4, 
                          delay: 0.1 + (linkIndex * 0.08) + (charIndex * 0.02),
                          ease: [0.16, 1, 0.3, 1]
                        }}
                        className="inline-block"
                      >
                        {char === " " ? "\u00A0" : char}
                      </motion.span>
                    ))}
                  </div>
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + (linkIndex * 0.08) + (link.label.length * 0.02) }}
                    className="h-px flex-1 bg-accent/20 hidden sm:block"
                  />
                </Link>
              ))}
            </nav>
            <div className="flex flex-col gap-8 mt-auto">
              {mounted && (
                <div className="flex flex-col gap-4">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">Appearance</p>
                  <div className="flex items-center bg-black/5 dark:bg-white/5 border border-border rounded-sm p-1 gap-1 w-fit" role="group" aria-label="Select color theme">
                    {themeOptions.map(opt => (
                      <button
                        key={opt.key}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 border-none bg-transparent text-ink-muted cursor-pointer rounded-sm transition-all text-xs font-medium uppercase tracking-wider",
                          theme === opt.key && "bg-paper text-ink shadow-sm dark:bg-sidebar-mid dark:text-white"
                        )}
                        onClick={() => setTheme(opt.key)}
                        aria-label={`${opt.label} theme`}
                        aria-pressed={theme === opt.key}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isWaitlistMode ? (
                <Button asChild className="w-full h-16 text-sm font-bold uppercase tracking-widest rounded-sm" onClick={() => setMobileMenuOpen(false)}>
                  <Link href="#waitlist-form">Join Waitlist</Link>
                </Button>
              ) : (
                <>
                  <Button asChild className="w-full h-16 text-sm font-bold uppercase tracking-widest rounded-sm">
                    <Link href="/register">Get started</Link>
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {/* --- HERO --- */}
        <section className="relative pt-32 pb-24 px-8 overflow-hidden bg-canvas noise-overlay">
          <div className="absolute inset-0 graph-bg opacity-[0.03]" aria-hidden="true" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(202,255,77,0.07)_0%,transparent_100%)]" aria-hidden="true" />
          
          <motion.div 
            className="max-w-[1200px] mx-auto relative z-10"
          >
            <FadeUp delay={0}>
              <Badge variant="outline" className="mb-8 font-mono text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 border-border-strong rounded-full bg-paper/50">
                <span className="text-accent mr-2">●</span> v1.2.0 is now live
              </Badge>
            </FadeUp>

            <motion.h1
              className="font-display text-[clamp(2.75rem,6vw,5rem)] font-bold leading-[1.05] tracking-[-0.04em] text-ink max-w-[900px] mb-8"
            >
              {"The headless CMS for developers who ".split(" ").map((word, i) => (
                <motion.span
                  key={i}
                  className="inline-block mr-[0.25em]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.1 + (i * 0.03), 
                    ease: [0.16, 1, 0.3, 1] 
                  }}
                >
                  {word}
                </motion.span>
              ))}
              <motion.em 
                className="italic text-accent not-italic inline-block mr-[0.25em]"
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: [0.8, 1.08, 1], y: 0 }}
                transition={{ 
                  duration: 0.6, 
                  delay: 0.1 + (9 * 0.03) + 0.1,
                  ease: [0.16, 1, 0.3, 1] 
                }}
              >
                hate
              </motion.em>
              {" CMS configuration.".split(" ").map((word, i) => (
                <motion.span
                  key={i + 10}
                  className="inline-block mr-[0.25em]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.1 + ((i + 11) * 0.03), 
                    ease: [0.16, 1, 0.3, 1] 
                  }}
                >
                  {word}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              className="text-[clamp(1.125rem,2vw,1rem)] font-light leading-[1.6] text-ink-muted max-w-[600px] mb-12"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              Open source headless CMS — REST API, visual block editor, zero configuration. 
              The industrial-editorial bridge for modern development.
            </motion.p>

            <motion.div
              className="flex items-center gap-4 flex-wrap"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {session ? (
                <Button asChild size="lg" className="h-14 px-10 text-sm font-bold uppercase tracking-widest rounded-sm shadow-2xl">
                  <Link href="/dashboard">
                    Go to Dashboard <ArrowRightIcon className="ml-2 size-4" />
                  </Link>
                </Button>
              ) : isWaitlistMode ? (
                <div className="w-full mt-4">
                  <div id="waitlist-form" className="scroll-mt-32">
                    <WaitlistForm />
                  </div>
                </div>
              ) : (
                <>
                  <Button asChild size="lg" className="h-14 px-10 text-sm font-bold uppercase tracking-widest rounded-sm shadow-2xl">
                    <Link href="/register">
                      Start building free <ArrowRightIcon className="ml-2 size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="h-14 px-10 text-sm font-bold uppercase tracking-widest rounded-sm border-border-strong bg-transparent hover:bg-paper/50">
                    <Link href="#demo">See how it works →</Link>
                  </Button>
                </>
              )}
            </motion.div>

            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 max-w-[800px] relative pt-8 mb-8 border-t border-border-strong/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              <div className="absolute top-0 left-0 w-1/3 h-px bg-gradient-to-r from-accent to-transparent" />
              {[
                { prefix: "< ", val: 40, suffix: "ms", label: "Median Latency" },
                { val: 100, suffix: "%", label: "Type-safe" },
                { val: "MIT", label: "License" },
                { val: "Zero", label: "Config required" }
              ].map((stat, i) => {
                const isNumber = typeof stat.val === "number";
                return (
                  <div key={i} className="flex flex-col border-l border-border-strong pl-6 py-2">
                    <span className="font-display text-3xl font-semibold text-ink mb-1">
                      {stat.prefix}
                      {isNumber ? (
                        <Counter value={stat.val as number} />
                      ) : (
                        stat.val
                      )}
                      {stat.suffix}
                    </span>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted">{stat.label}</span>
                  </div>
                );
              })}
            </motion.div>
          </motion.div>
        </section>

        <Ticker />

        {/* --- FEATURES --- */}
        <section id="features" className="py-32 px-8 bg-paper">
          <div className="max-w-[1200px] mx-auto">
            <FadeUp>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-6">Industrial Core</p>
              <h2 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-semibold tracking-[-0.03em] leading-[1.1] text-ink max-w-[700px] mb-8">
                The tools to <em className="italic text-accent not-italic">scale content</em> without friction.
              </h2>
              <p className="text-lg font-light leading-[1.6] text-ink-muted max-w-[600px] mb-20">
                Built for builders. We&apos;ve abstracted the complexity so you can focus on the schema and the output.
              </p>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border rounded-sm overflow-hidden">
              {FEATURE_LIST.map((f, i) => (
                <DirectionalFade key={f.num} index={i} delay={i * 0.05} className="group/feature h-full">
                  <Card className="h-full bg-paper border-none rounded-none p-10 flex flex-col gap-6 transition-all hover:bg-canvas relative overflow-hidden group-hover/feature:shadow-inner">
                    <div className="absolute top-0 right-0 p-6 font-display text-7xl font-bold text-ink-faint/10 leading-none pointer-events-none select-none">
                      {f.num}
                    </div>
                    <div className="w-12 h-12 bg-accent/5 border border-accent/10 rounded-sm flex items-center justify-center text-accent transition-transform group-hover/feature:scale-110">
                      {f.icon}
                    </div>
                    <div className="space-y-3">
                      <CardTitle className="font-display text-xl font-semibold text-ink leading-tight">
                        {f.title}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed text-ink-muted font-light">
                        {f.desc}
                      </CardDescription>
                    </div>
                  </Card>
                </DirectionalFade>
              ))}
            </div>

            {/* --- ROADMAP --- */}
            <FadeUp delay={0.3} className="mt-32">
              <div className="flex items-center gap-4 mb-12">
                <Separator className="flex-1" />
                <Badge variant="outline" className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 border-border-strong rounded-full">
                  Upcoming Pipeline
                </Badge>
                <Separator className="flex-1" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {COMING_SOON.map((item, i) => (
                  <Card key={i} className="bg-canvas border-dashed border-border-strong p-8 rounded-sm transition-all hover:border-solid hover:shadow-lg hover:-translate-y-1">
                    <Badge variant="secondary" className="mb-4 font-mono text-[9px] font-bold uppercase tracking-widest bg-border-strong text-paper rounded-sm">
                      Planned
                    </Badge>
                    <CardTitle className="font-display text-base font-semibold text-ink mb-2">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="text-[13px] leading-relaxed text-ink-muted font-light">
                      {item.desc}
                    </CardDescription>
                  </Card>
                ))}
              </div>
            </FadeUp>
          </div>
        </section>

        <UseCases />

        <Comparison />

        {/* --- TESTIMONIALS --- */}
        <section id="testimonials" className="py-32 px-8 bg-paper relative overflow-hidden">
          <div className="absolute inset-0 graph-bg opacity-[0.03]" aria-hidden="true" />
          <div className="max-w-[1200px] mx-auto text-center relative z-10">
            <FadeUp>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-6">Social Proof</p>
              <h2 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-semibold tracking-[-0.03em] leading-[1.1] text-ink mb-12">
                What early <em className="italic text-accent not-italic">testers</em> are saying.
              </h2>
              
              <div className="bg-canvas/50 border-2 border-dashed border-border-strong p-16 rounded-sm">
                <p className="font-display italic text-2xl text-ink-muted mb-4">&ldquo;Testimonials coming soon &mdash; join the waitlist to be featured.&rdquo;</p>
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-border-strong/20" />
                  <div className="text-left">
                    <div className="w-24 h-4 bg-border-strong/20 rounded-full mb-2" />
                    <div className="w-16 h-3 bg-border-strong/10 rounded-full" />
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* --- HOW IT WORKS --- */}
        <section id="how-it-works" className="py-32 px-8 bg-canvas">
          <div className="max-w-[1200px] mx-auto">
            <FadeUp className="text-center mb-20">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-6">How it works</p>
              <h2 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-semibold tracking-[-0.03em] leading-[1.1] text-ink mx-auto max-w-[700px]">
                Four steps from <em className="italic text-accent not-italic">schema to screen</em>.
              </h2>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
              {[
                { 
                  num: "01", 
                  label: "DEFINE YOUR SCHEMA", 
                  title: "Model", 
                  desc: "Build your content structure visually. Fields, types, validations — no migrations, no config files. Every schema change is reflected in your API instantly." 
                },
                { 
                  num: "02", 
                  label: "WRITE WITH CONTEXT", 
                  title: "Author", 
                  desc: "Editors get a clean block-based canvas. No HTML. No Markdown syntax memorisation. Structured blocks map one-to-one to the JSON your frontend receives." 
                },
                { 
                  num: "03", 
                  label: "CONTROL THE RELEASE", 
                  title: "Publish", 
                  desc: "Draft until you're ready. One click publishes — or schedule it. Webhooks fire automatically so your CDN rebuilds and your search index updates without a developer in the loop." 
                },
                { 
                  num: "04", 
                  label: "CONSUME ANYWHERE", 
                  title: "Fetch", 
                  desc: "Your content is a REST endpoint. Fetch it from Next.js, a native app, a static site — anywhere that speaks HTTP. No SDK required." 
                }
              ].map((step, i) => (
                <FadeUp key={step.num} delay={i * 0.1} className="flex flex-col group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-paper border border-border-strong rounded-sm flex items-center justify-center font-display text-xl font-bold text-ink transition-all group-hover:scale-110 group-hover:border-accent group-hover:shadow-lg">
                      {step.num}
                    </div>
                    <div className="h-px flex-1 bg-border-strong/30" />
                  </div>
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-accent mb-2">{step.label}</p>
                  <h3 className="font-display text-2xl font-semibold text-ink mb-4">{step.title}</h3>
                  <p className="text-[13px] leading-relaxed text-ink-muted font-light">{step.desc}</p>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* --- LIVE DEMO --- */}
        <section id="demo" className="py-32 px-8 bg-paper">
          <div className="max-w-[1200px] mx-auto">
            <FadeUp className="mb-16">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Interface</p>
                  <h2 className="font-display text-[clamp(2rem,5vw,3rem)] font-semibold tracking-[-0.03em] leading-[1.1] text-ink">
                    The <em className="italic text-accent not-italic">Editorial</em> Engine.
                  </h2>
                </div>
                <p className="text-base font-light text-ink-muted max-w-[400px] leading-relaxed">
                  Experience the precision of the block editor. Every change reflects instantly in the structured API response.
                </p>
              </div>
            </FadeUp>
            <FadeUp delay={0.1}>
              <Card className="overflow-hidden border-border shadow-2xl shadow-black/10 p-0 rounded-sm">
                <LiveDemo />
              </Card>
            </FadeUp>
          </div>
        </section>

        {/* --- PRICING --- */}
        <section id="pricing" className="py-32 px-8 bg-canvas">
          <div className="max-w-[1200px] mx-auto">
            <FadeUp className="text-center mb-24">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-6">Commercial</p>
              <h2 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-semibold tracking-[-0.03em] leading-[1.1] text-ink mb-8">
                Simple <em className="italic text-accent not-italic">pricing</em>.
              </h2>
              {isWaitlistMode && (
                <div className="inline-flex items-center gap-3 bg-accent-bright/10 border border-accent-bright/20 px-6 py-3 rounded-full text-sm font-medium text-ink">
                  <span className="w-2 h-2 rounded-full bg-accent-bright animate-pulse" />
                  These are post-launch prices. Early access members get 40% off.
                </div>
              )}
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {APP_CONFIG.pricing.map((tier, i) => (
                <FadeUp key={tier.plan} delay={i * 0.1}>
                  <Card className={cn(
                    "h-full p-10 flex flex-col border rounded-sm transition-all duration-300 relative overflow-hidden",
                    tier.featured ? "border-accent-bright border-2 bg-paper shadow-2xl" : "border-border bg-paper/50",
                    isWaitlistMode && "opacity-80 grayscale-[0.5]"
                  )}>
                    {isWaitlistMode && (
                       <div className="absolute inset-0 bg-white/5 z-20 pointer-events-none" />
                    )}
                    {tier.featured && (
                      <>
                        <div className="shimmer-border-container opacity-50" />
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-accent-bright to-accent z-10" />
                        <Badge className="w-fit mb-6 bg-accent-bright text-ink rounded-full px-4 py-1 font-mono text-[10px] font-bold uppercase tracking-widest border-none relative z-10">
                          Standard
                        </Badge>
                      </>
                    )}
                    <CardHeader className="p-0 mb-8 space-y-4">
                      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-ink-muted">{tier.plan}</p>
                      <div className="space-y-1">
                        <CardTitle className="font-display text-5xl font-semibold text-ink">{tier.price}</CardTitle>
                        <p className="text-[12px] font-medium text-ink-muted tracking-widest uppercase">{tier.period}</p>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 mb-12">
                      <ul className="space-y-4">
                        {tier.features.map(f => (
                          <li key={f} className="flex items-start gap-3 text-[13px] text-ink-muted font-light leading-snug">
                            <CheckIcon className="size-4 text-accent shrink-0 mt-0.5" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <Button asChild variant={tier.featured ? "default" : "outline"} className={cn(
                      "w-full h-14 rounded-sm text-[11px] font-bold uppercase tracking-[0.2em] border-border-strong relative z-10",
                      isWaitlistMode && "pointer-events-none opacity-50"
                    )}>
                      <Link href={isWaitlistMode ? "#waitlist-form" : "/register"}>
                        {isWaitlistMode ? "Coming Soon" : tier.cta}
                      </Link>
                    </Button>
                  </Card>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        <FAQ />

        {/* --- CTA --- */}
        <section className="bg-sidebar py-48 px-8 relative overflow-hidden noise-overlay">
          <div className="absolute inset-0 bg-graph-bg opacity-[0.03]" aria-hidden="true" />
          
          {/* Parallax Depth Circles */}
          <motion.div 
            style={{ y: useTransform(useScroll().scrollYProgress, [0.7, 1], [0, 150]) }} 
            className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent/10 blur-[120px] pointer-events-none" 
          />
          <motion.div 
            style={{ y: useTransform(useScroll().scrollYProgress, [0.7, 1], [0, -250]) }} 
            className="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] rounded-full bg-accent-bright/10 blur-[100px] pointer-events-none" 
          />
          <motion.div 
            style={{ y: useTransform(useScroll().scrollYProgress, [0.7, 1], [0, 300]) }} 
            className="absolute top-[30%] right-[-10%] w-[300px] h-[300px] rounded-full bg-accent-bright/5 blur-[80px] pointer-events-none" 
          />

          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_100%,rgba(202,255,77,0.08)_0%,transparent_70%),radial-gradient(circle_400px_at_10%_20%,rgba(78,124,89,0.1)_0%,transparent_100%)]" aria-hidden="true" />
          
          <div className="max-w-[1200px] mx-auto relative z-10 flex flex-col items-center text-center">
            <FadeUp>
              <h2 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-bold tracking-[-0.04em] text-white leading-[1.05] mb-8">
                Build your next project<br />on <em className="italic text-accent-bright not-italic">{APP_CONFIG.name}</em>.
              </h2>
              <p className="text-lg text-white/50 max-w-[540px] mb-14 leading-relaxed font-light">
                The industrial-strength headless CMS for developers who care about structure and designers who care about detail.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                {isWaitlistMode ? (
                  <Button asChild size="lg" className="h-16 px-12 text-sm font-bold uppercase tracking-widest rounded-sm bg-accent-bright text-sidebar hover:bg-white shadow-2xl">
                    <Link href="#waitlist-form">
                      Join the Waitlist <ArrowRightIcon className="ml-2 size-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button asChild size="lg" className="h-16 px-12 text-sm font-bold uppercase tracking-widest rounded-sm bg-accent-bright text-sidebar hover:bg-white shadow-2xl">
                    <Link href="/register">
                      Create free account <ArrowRightIcon className="ml-2 size-4" />
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline" size="lg" className="h-16 px-12 text-sm font-bold uppercase tracking-widest rounded-sm bg-transparent border-white/20 text-white hover:bg-white/5 hover:border-white/40">
                  <Link href={APP_CONFIG.docsUrl}>Documentation</Link>
                </Button>
              </div>
            </FadeUp>
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-paper border-t border-border pt-24 pb-12 px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="col-span-1 md:col-span-1 space-y-6">
              <Link href="/" className="font-display text-2xl font-semibold text-ink flex items-center gap-3 no-underline">
                <div className="w-8 h-8 bg-sidebar rounded-[4px] flex items-center justify-center">
                  <div className="w-3.5 h-3.5 bg-accent-bright rounded-[1px]" />
                </div>
                {APP_CONFIG.name}
              </Link>
              <p className="text-sm text-ink-muted leading-relaxed font-light">
                The industrial-editorial headless CMS built for performance and precision.
              </p>
            </div>
            <div className="col-span-1 md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-12">
              <div className="space-y-6">
                <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink">Product</h4>
                <nav className="flex flex-col gap-3">
                  {["Features", "Demo", "Pricing", "Roadmap"].map(l => (
                    <Link key={l} href={`#${l.toLowerCase()}`} className="text-[13px] text-ink-muted hover:text-ink transition-colors no-underline font-light">{l}</Link>
                  ))}
                </nav>
              </div>
              <div className="space-y-6">
                <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink">Company</h4>
                <nav className="flex flex-col gap-3">
                  {["About", "Blog", "Careers", "Legal"].map(l => (
                    <Link key={l} href="#" className="text-[13px] text-ink-muted hover:text-ink transition-colors no-underline font-light">{l}</Link>
                  ))}
                </nav>
              </div>
              <div className="space-y-6">
                <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink">Resources</h4>
                <nav className="flex flex-col gap-3">
                  {["Documentation", "API Reference", "Status", "Support"].map(l => (
                    <Link key={l} href="#" className="text-[13px] text-ink-muted hover:text-ink transition-colors no-underline font-light">{l}</Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
          <div className="pt-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[11px] text-ink-faint font-mono uppercase tracking-[0.1em]">© 2024 FLOWCMS INFRASTRUCTURE. ALL RIGHTS RESERVED.</p>
            <div className="flex items-center gap-8">
              {["Twitter", "GitHub", "Discord"].map(s => (
                <Link key={s} href="#" className="text-[11px] text-ink-faint hover:text-accent transition-colors no-underline font-mono uppercase tracking-[0.1em]">{s}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}