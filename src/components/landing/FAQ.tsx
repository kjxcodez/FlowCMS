"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PlusIcon, MinusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const FAQS = [
  {
    question: "What makes FlowCMS different from Sanity or Strapi?",
    answer: "Unlike Sanity, FlowCMS is fully self-hostable and open-source with no vendor lock-in. Compared to Strapi, we provide a more focused 'industrial' experience with zero-config setup and a visual block editor that maps 1:1 to JSON, eliminating the complexity of traditional relational CMS management."
  },
  {
    question: "How do I get early access?",
    answer: "Join the waitlist on the home page. We are inviting developers in batches based on their use cases. Referral codes from existing waitlist members will move you up the queue significantly."
  },
  {
    question: "What does it cost after the free trial?",
    answer: "FlowCMS core is permanently MIT-licensed and free to self-host. For our managed cloud, we offer a generous Hobby tier, with Pro starting at ₹1,999/mo. Early access members get a 40% discount for life."
  },
  {
    question: "Who owns my content data?",
    answer: "You do, always. Whether you use FlowCMS Cloud or self-host, your data belongs to you. You can export everything at any time via our CLI or REST API in standard JSON format."
  },
  {
    question: "Can I self-host FlowCMS?",
    answer: "Yes. We provide a official Docker image for one-command deployment on VPS, Fly.io, or Railway. The MIT license ensures you can run your own infrastructure without restrictions."
  },
  {
    question: "How does migration from other CMS work?",
    answer: "Migration is straightforward. You can use our CLI tool: 'flowcms import --from sanity'. It handles field mapping for standard types automatically and provides a log for any custom field adjustments needed."
  },
  {
    question: "Is FlowCMS GDPR compliant?",
    answer: "Yes. We take data privacy seriously. For cloud users, we offer EU data residency. For self-hosted users, you have full control over where your data lives and how it's processed."
  },
  {
    question: "What's the API rate limit?",
    answer: "Self-hosted versions have no limits other than your hardware. On FlowCMS Cloud, the Hobby tier supports 5k requests/mo, while Pro supports 250k. Custom limits are available for Agency and Enterprise partners."
  },
  {
    question: "Which frameworks are supported?",
    answer: "FlowCMS is framework-agnostic. It works with any technology that can fetch JSON via HTTP, including Next.js, Remix, Astro, Vue, Swift, Kotlin, and even legacy PHP environments."
  },
  {
    question: "How does the block editor map to the API?",
    answer: "Every block in the editor is a structured object. When you save, it translates directly into a JSON array of blocks. This ensures your frontend developer knows exactly what shape to expect without writing custom parsers."
  }
];

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
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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
            {FAQS.map((faq, i) => (
              <FAQItem
                key={i}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === i}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
