"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const FAQ_GROUPS = [
  {
    label: "Getting Started",
    faqs: [
      {
        question: "What makes FlowCMS different from Sanity or Strapi?",
        answer: "Unlike Sanity, FlowCMS is fully self-hostable and MIT-licensed with no vendor lock-in. Unlike Strapi, setup takes minutes not hours — no manual plugin configuration, no migrations to write. The block editor maps 1:1 to predictable JSON, so your frontend always knows the exact data shape."
      },
      {
        question: "How do I get early access?",
        answer: "Simply create an account on the sign up page! FlowCMS is currently in Early Access Beta, meaning you can register and start building immediately."
      },
      {
        question: "How long does it take to set up FlowCMS?",
        answer: "Cloud: under five minutes. Create a workspace, define your first content type, get an API key, make your first fetch call. Self-hosted with Docker: under fifteen minutes if you have Docker installed. There is no plugin configuration, no build step, and no framework to learn."
      },
      {
        question: "Do I need to write any backend code?",
        answer: "No. FlowCMS is the backend. Define your schema visually, publish content, fetch it from your frontend. The only code you write is a standard fetch call to the REST API — the same code you would write to call any JSON API."
      },
      {
        question: "How do I connect FlowCMS to my Next.js app?",
        answer: "Add your API key to your .env file and fetch from our REST endpoint. For Next.js specifically, use getStaticProps or the App Router fetch with our API URL. We have a dedicated Next.js quickstart in the docs that gets you from zero to a working page in under ten minutes."
      },
      {
        question: "Which frameworks work with FlowCMS?",
        answer: "Any framework that can make an HTTP request. We have first-class support for Next.js with a dedicated integration package. REST API works equally well with Remix, Astro, Vue, SvelteKit, React Native, Swift, and Kotlin."
      },
      {
        question: "Can non-technical editors use FlowCMS?",
        answer: "Yes. The block editor is designed for editors who have never written code. They see a clean canvas with text fields, image uploads, and block controls — no JSON, no markdown syntax, no configuration. Developers control the schema; editors control the content."
      }
    ]
  },
  {
    label: "Technical",
    faqs: [
      {
        question: "How does the block editor map to the API?",
        answer: "Every block is a typed JSON object with a predictable shape. Publish a page and the API returns an array of blocks your frontend renders. No custom parsers, no Portable Text, no GROQ — just JSON you already know how to use."
      },
      {
        question: "Is there a TypeScript SDK?",
        answer: "A typed TypeScript client (@flowcms/client) is in development and will be released to early access members first. The CLI will also generate TypeScript interface definitions directly from your schema. Both are coming in Q3 2026."
      },
      {
        question: "Is my API key secure?",
        answer: "API keys are stored as hashed values — we never store the plaintext key after generation. Copy it when you create it. If you lose it, generate a new one. Keys can be scoped to specific content types and environments, and revoked instantly from the dashboard."
      },
      {
        question: "What are the API rate limits?",
        answer: "Self-hosted: no limits beyond your hardware. Cloud Hobby: 5,000 requests/month. Pro: 250,000/month. Agency: 1,000,000/month pooled across workspaces."
      },
      {
        question: "What counts as an API request?",
        answer: "Every call to /api/v1/* with a valid API key counts as one request, regardless of whether it was served from cache. Dashboard usage, webhook deliveries, and failed authentication attempts do not count toward your limit."
      },
      {
        question: "How do I handle content in multiple languages?",
        answer: "Each entry stores a locale code. Create entries for each language variant and the API returns the correct locale via the ?locale= query parameter, falling back to your default locale automatically. A full translation UI with side-by-side editing and completeness tracking is in development — coming in a future release."
      },
      {
        question: "Can I preview content before publishing?",
        answer: "Yes. Draft preview tokens let you fetch unpublished content by adding a token parameter to your API call. Add the token to your frontend's preview route and editors can see exactly how their content looks before it goes live."
      },
      {
        question: "How do I trigger a site rebuild when I publish?",
        answer: "Configure a webhook in your workspace settings. When you publish an entry or page, FlowCMS sends a POST request to your URL with the event payload. Use this to trigger Vercel deploys, Netlify builds, or any custom rebuild pipeline."
      },
      {
        question: "Can I migrate from Sanity or Contentful?",
        answer: "A CLI migration tool for Sanity, Contentful, and standard JSON is in development. Early access members will get access first. If you need to migrate urgently, contact us and we will assist manually."
      }
    ]
  },
  {
    label: "Team and Workflow",
    faqs: [
      {
        question: "Can multiple people work in the same workspace?",
        answer: "Yes. Team invitations with role-based access are in final development and will be available on Pro and above. Roles: Owner, Admin, Editor, and Viewer. Early access members will get team features as part of their free Pro month."
      },
      {
        question: "What is the uptime SLA?",
        answer: "The Hobby and Pro tiers target 99.9% uptime with no formal SLA. Agency tier includes a 99.9% uptime commitment. Enterprise includes a contractual SLA with credits for downtime. Self-hosted uptime depends entirely on your own infrastructure."
      },
      {
        question: "What happens if I exceed my API request limit?",
        answer: "On Hobby, requests beyond 5,000 per month return a 403 with a clear error code. We do not silently drop requests or surprise you with overage charges on Hobby. Pro and Agency users can enable overage billing to continue serving traffic beyond their plan limit at a per-request rate."
      }
    ]
  },
  {
    label: "Pricing and Trust",
    faqs: [
      {
        question: "What does it cost?",
        answer: "FlowCMS core is MIT-licensed and free to self-host forever. Our managed cloud starts with a generous free Hobby tier. Pro is ₹1,999/month."
      },
      {
        question: "Can I start free and upgrade later?",
        answer: "Yes. The Hobby tier is free forever with no credit card required. When you outgrow it, upgrade to Pro from your billing settings. Your content, API keys, and schema carry over — there is no migration when you upgrade."
      },
      {
        question: "Is there an annual plan with a discount?",
        answer: "Annual billing with a 20% discount is coming soon. Pro billed annually will be ₹19,190/year versus ₹23,988 monthly. Agency annually will be ₹62,390/year. Early access users will be notified as soon as annual plans go live."
      },
      {
        question: "Do you offer refunds?",
        answer: "Yes. If you are not satisfied within the first 14 days of any paid plan, contact us at support@getflowcms.com for a full refund. No questions asked."
      },
      {
        question: "Who owns my content data?",
        answer: "You do, always. Export everything at any time as standard JSON via the REST API. Self-hosted users have complete control over their infrastructure and data location."
      },
      {
        question: "Can I self-host FlowCMS?",
        answer: "Yes. We provide an official Docker image. Run it with docker-compose up and it handles database migrations automatically. Full instructions are in our documentation."
      },
      {
        question: "Is FlowCMS GDPR compliant?",
        answer: "Yes. Self-hosted users control their own data location entirely. For cloud users, data is stored in secure infrastructure. Enterprise customers can request custom data residency arrangements."
      },
      {
        question: "What does MIT license actually mean for me?",
        answer: "You can use FlowCMS for any project, commercial or personal, without paying us. You can modify the code, self-host it, and distribute it. The only restriction is that you keep the MIT license notice in the code. We make money from the managed cloud, not from restricting the software."
      }
    ]
  }
];

export const FAQS = FAQ_GROUPS.flatMap(g => g.faqs);

const FAQItem = ({ question, answer, isOpen, onClick }: { question: string, answer: string, isOpen: boolean, onClick: () => void }) => {
  return (
    <motion.div 
      className="border-b border-border last:border-none overflow-hidden rounded-sm transition-all"
      animate={{ 
        backgroundColor: isOpen ? "rgba(202, 255, 77, 0.04)" : "transparent",
      }}
      transition={{ duration: 0.3 }}
    >
      <button
        onClick={onClick}
        className="w-full px-6 py-8 flex items-center justify-between text-left group transition-colors"
      >
        <span className={cn(
          "font-display text-xl md:text-2xl font-semibold tracking-tight transition-colors",
          isOpen ? "text-accent" : "text-ink group-hover:text-accent"
        )}>
          {question}
        </span>
        <motion.div 
          animate={{ 
            rotate: isOpen ? 45 : 0,
            backgroundColor: isOpen ? "#CAFF4D" : "transparent",
            borderColor: isOpen ? "#CAFF4D" : "rgba(255,255,255,0.1)",
            color: isOpen ? "#000000" : "#888888"
          }}
          className="shrink-0 ml-4 p-2 rounded-sm border transition-all"
        >
          <PlusIcon size={16} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-8 pr-12 text-ink-muted font-light leading-relaxed max-w-[800px]">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const FAQ = () => {
  const [openId, setOpenId] = useState<string | null>("0-0");

  return (
    <section id="faq" className="py-32 px-8 bg-paper">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-6">Clarification</p>
            <h2 className="font-display text-[clamp(2.5rem,5vw,3.25rem)] font-semibold tracking-[-0.03em] leading-[1.1] text-ink mb-8">
              Common <em className="italic text-accent not-italic">questions</em>.
            </h2>
            <p className="text-lg font-light leading-[1.6] text-ink-muted max-w-[400px]">
              Everything you need to know about the platform, the architecture, and the community.
            </p>
          </div>
          <div className="lg:col-span-8 lg:pl-12 border-t lg:border-t-0 lg:border-l border-border-strong/40">
            {FAQ_GROUPS.map((group, gIndex) => (
              <div key={gIndex} className="mb-12 last:mb-0">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent/60 mb-4 mt-8 first:mt-0">
                  {group.label}
                </p>
                <div className="border-t border-border/40">
                  {group.faqs.map((faq, fIndex) => {
                    const id = `${gIndex}-${fIndex}`;
                    return (
                      <FAQItem
                        key={id}
                        question={faq.question}
                        answer={faq.answer}
                        isOpen={openId === id}
                        onClick={() => setOpenId(openId === id ? null : id)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

