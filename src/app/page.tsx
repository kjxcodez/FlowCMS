"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "motion/react";
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
  PenLineIcon, 
  UsersIcon, 
  WebhookIcon 
} from "lucide-react";
import { Ticker } from "@/components/landing/Ticker";
import { LiveDemo } from "@/components/landing/LiveDemo";
import { useSession } from "@/lib/auth-client";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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

const FEATURE_LIST = [
  {
    num: "01", title: "Visual block editor",
    desc: "Drag and drop content blocks to build page layouts. Each block maps to a structured JSON field your API returns predictably.",
    icon: <LayoutGridIcon className="size-5" strokeWidth={1.5} />
  },
  {
    num: "02", title: "Flexible content types",
    desc: "Define your own schema: text, rich text, images, references. Each type produces a typed field in the API response.",
    icon: <FileTextIcon className="size-5" strokeWidth={1.5} />
  },
  {
    num: "03", title: "REST API first",
    desc: "Every content type gets a fully documented REST endpoint. Filter by status, paginate, sort. Consistent JSON shape.",
    icon: <CodeIcon className="size-5" strokeWidth={1.5} />
  },
  {
    num: "04", title: "Draft & publish",
    desc: "Write in draft mode, publish when ready. Preview endpoints let you render drafts before they go live.",
    icon: <PenLineIcon className="size-5" strokeWidth={1.5} />
  },
  {
    num: "05", title: "Role-based access",
    desc: "Admins define types. Editors create entries. Developers get API keys. Roles keep responsibilities clear.",
    icon: <UsersIcon className="size-5" strokeWidth={1.5} />
  },
  {
    num: "06", title: "Webhook triggers",
    desc: "Send POST requests on publish or update events. Trigger rebuilds or sync to external search indexes.",
    icon: <WebhookIcon className="size-5" strokeWidth={1.5} />
  },
];

const COMING_SOON = [
  { title: "Edge Caching", desc: "Global CDN distribution for < 20ms response times worldwide." },
  { title: "GraphQL Support", desc: "Native GraphQL endpoints with full introspection support." },
  { title: "AI Assistant", desc: "Generate content suggestions and SEO metadata automatically." },
  { title: "Mobile SDKs", desc: "Optimized libraries for Swift, Kotlin, and React Native." },
];

export default function LandingPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const themeOptions = [
    { key: "light", icon: <SunIcon size={16} />, label: "Light" },
    { key: "dark", icon: <MoonIcon size={16} />, label: "Dark" },
    { key: "system", icon: <SystemIcon size={16} />, label: "System" },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink selection:bg-accent-bright/30">
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
              <div className="flex items-center bg-black/5 dark:bg-white/5 border border-border rounded-sm p-1 gap-1" role="group" aria-label="Select color theme">
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
            <nav className="flex flex-col gap-4">
              {APP_CONFIG.nav.map(link => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-display text-4xl font-semibold text-ink no-underline py-2"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col gap-4 mt-auto">
              <Button asChild className="w-full h-16 text-sm font-bold uppercase tracking-widest rounded-sm">
                <Link href="/register">Get started</Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-16 text-sm font-bold uppercase tracking-widest rounded-sm border-border-strong">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="main-content">
        {/* --- HERO --- */}
        <section ref={heroRef} className="min-h-screen flex flex-col justify-center px-8 pt-[140px] pb-32 relative overflow-hidden noise-overlay">
          <div className="absolute inset-0 z-0 graph-bg opacity-30" aria-hidden="true" />
          <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(202,255,77,0.08)_0%,transparent_70%),radial-gradient(ellipse_50%_40%_at_80%_80%,rgba(78,124,89,0.05)_0%,transparent_60%)]" aria-hidden="true" />

          <motion.div className="max-w-[1200px] mx-auto w-full relative z-[2]" style={{ y: heroY, opacity: heroOpacity }}>
            <FadeUp>
              <div className="inline-flex items-center gap-3 font-mono text-[10px] font-bold text-accent tracking-[0.2em] uppercase bg-accent/5 border border-accent/20 px-4 py-2 rounded-full mb-10">
                <span className="w-2 h-2 rounded-full bg-accent-bright shadow-[0_0_0_4px_rgba(202,255,77,0.2)] animate-pulse-custom" />
                Open source industrial CMS
              </div>
            </FadeUp>

            <motion.h1
              className="font-display text-[clamp(2.75rem,6vw,5rem)] font-bold leading-[1.05] tracking-[-0.04em] text-ink max-w-[900px] mb-8"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              Content <em className="italic text-accent not-italic">orchestrated</em> for high-performance teams.
            </motion.h1>

            <motion.p
              className="text-[clamp(1.125rem,2vw,1rem)] font-light leading-[1.6] text-ink-muted max-w-[600px] mb-12"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {APP_CONFIG.tagline}. Build your schema visually, deliver it instantly via REST. 
              The industrial-editorial bridge for modern development.
            </motion.p>

            <motion.div
              className="flex items-center gap-4 flex-wrap"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {session ? (
                <Button asChild size="lg" className="h-14 px-10 text-sm font-bold uppercase tracking-widest rounded-sm shadow-2xl">
                  <Link href="/dashboard">
                    Go to Dashboard <ArrowRightIcon className="ml-2 size-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="h-14 px-10 text-sm font-bold uppercase tracking-widest rounded-sm shadow-2xl">
                    <Link href="/register">
                      Start building free <ArrowRightIcon className="ml-2 size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="h-14 px-10 text-sm font-bold uppercase tracking-widest rounded-sm border-border-strong bg-transparent hover:bg-paper/50">
                    <Link href="#demo">Watch Live Demo</Link>
                  </Button>
                </>
              )}
            </motion.div>

            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 max-w-[800px] relative pt-8 mb-8 border-t border-border-strong/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="absolute top-0 left-0 w-1/3 h-px bg-gradient-to-r from-accent to-transparent" />
              {[
                { val: "< 40ms", label: "Latency" },
                { val: "100%", label: "Type-safe" },
                { val: "REST", label: "Protocol" },
                { val: "MIT", label: "License" }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col border-l border-border-strong pl-6 py-2">
                  <span className="font-display text-3xl font-semibold text-ink mb-1">{stat.val}</span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted">{stat.label}</span>
                </div>
              ))}
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
                <FadeUp key={f.num} delay={i * 0.05} className="group/feature h-full">
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
                </FadeUp>
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

        {/* --- WORKFLOW --- */}
        <section id="how-it-works" className="py-32 px-8 bg-canvas">
          <div className="max-w-[1200px] mx-auto">
            <FadeUp className="text-center mb-20">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-6">Execution</p>
              <h2 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-semibold tracking-[-0.03em] leading-[1.1] text-ink mx-auto max-w-[700px]">
                The editorial <em className="italic text-accent not-italic">production bridge</em>.
              </h2>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-px bg-border-strong border-t border-dashed border-border-strong opacity-40 z-0" />
              
              {[
                { num: "01", title: "Model", desc: "Define content types visually with industrial-strength validation rules." },
                { num: "02", title: "Author", desc: "Editors build rich layouts with a clean, focused block-based interface." },
                { num: "03", title: "Deploy", desc: "Consume predictable JSON via REST and render on any device or platform." }
              ].map((step, i) => (
                <FadeUp key={step.num} delay={i * 0.15} className="relative z-10 flex flex-col items-center text-center group">
                  <div className="w-20 h-20 bg-paper border border-border-strong rounded-full flex items-center justify-center font-display text-3xl font-bold text-ink mb-8 transition-all group-hover:scale-110 group-hover:border-accent group-hover:shadow-xl">
                    {step.num}
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-ink mb-4">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-muted font-light max-w-[280px]">{step.desc}</p>
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
              <h2 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-semibold tracking-[-0.03em] leading-[1.1] text-ink">
                Scaling <em className="italic text-accent not-italic">Infrastructure</em>.
              </h2>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {APP_CONFIG.pricing.map((tier, i) => (
                <FadeUp key={tier.plan} delay={i * 0.1}>
                  <Card className={cn(
                    "h-full p-10 flex flex-col border rounded-sm transition-all duration-300 hover:-translate-y-2 relative overflow-hidden",
                    tier.featured ? "border-accent-bright border-2 bg-paper shadow-2xl hover:shadow-[0_20px_60px_rgba(202,255,77,0.15)]" : "border-border bg-paper/50 hover:shadow-xl"
                  )}>
                    {tier.featured && (
                      <>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-accent-bright to-accent" />
                        <Badge className="w-fit mb-6 bg-accent-bright text-ink rounded-full px-4 py-1 font-mono text-[10px] font-bold uppercase tracking-widest border-none">
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
                    <Button asChild variant={tier.featured ? "default" : "outline"} className="w-full h-14 rounded-sm text-[11px] font-bold uppercase tracking-[0.2em] border-border-strong">
                      <Link href="/register">{tier.cta}</Link>
                    </Button>
                  </Card>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* --- CTA --- */}
        <section className="bg-sidebar py-32 px-8 relative overflow-hidden noise-overlay">
          <div className="absolute inset-0 bg-graph-bg opacity-[0.03]" aria-hidden="true" />
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
                <Button asChild size="lg" className="h-16 px-12 text-sm font-bold uppercase tracking-widest rounded-sm bg-accent-bright text-sidebar hover:bg-white shadow-2xl">
                  <Link href="/register">
                    Create free account <ArrowRightIcon className="ml-2 size-4" />
                  </Link>
                </Button>
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
                <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink">Resources</h4>
                <nav className="flex flex-col gap-3">
                  {["Documentation", "API Reference", "Guides", "Support"].map(l => (
                    <Link key={l} href="#" className="text-[13px] text-ink-muted hover:text-ink transition-colors no-underline font-light">{l}</Link>
                  ))}
                </nav>
              </div>
              <div className="space-y-6">
                <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink">Legal</h4>
                <nav className="flex flex-col gap-3">
                  {APP_CONFIG.footerLinks.map(l => (
                    <Link key={l} href="#" className="text-[13px] text-ink-muted hover:text-ink transition-colors no-underline font-light">{l}</Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
          
          <Separator className="mb-12 opacity-50" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-accent uppercase tracking-widest bg-accent/5 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              All systems operational
            </div>
            <p className="font-mono text-[10px] font-bold text-ink-faint uppercase tracking-widest">
              © {new Date().getFullYear()} {APP_CONFIG.name}. {APP_CONFIG.copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}