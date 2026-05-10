"use client";

import React, { useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { 
  BookOpenIcon, 
  CodeIcon, 
  SmartphoneIcon, 
  BuildingIcon,
  GlobeIcon,
  LayersIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const CASES = [
  {
    title: "Documentation Hubs",
    desc: "Developer teams publishing API docs across multiple versions and products. Define your doc schema once — FlowCMS generates a filterable, searchable endpoint your docs site consumes directly. No static rebuilds for every content edit.",
    icon: <BookOpenIcon size={24} strokeWidth={1.5} />,
    grid: "col-span-1 md:col-span-6 lg:col-span-8"
  },
  {
    title: "Developer Blogs",
    desc: "Technical writers who need a high-fidelity canvas for code and rich media. Model your blog schema once, fetch it from Next.js, and focus on the craft of writing without touching a single config file.",
    icon: <CodeIcon size={24} strokeWidth={1.5} />,
    grid: "col-span-1 md:col-span-6 lg:col-span-4"
  },
  {
    title: "Mobile App Backend",
    desc: "iOS and Android teams tired of deploying app updates just to change copy. Model your content types in FlowCMS, fetch them at runtime. Push content changes without touching App Store review.",
    icon: <SmartphoneIcon size={24} strokeWidth={1.5} />,
    grid: "col-span-1 md:col-span-6 lg:col-span-4"
  },
  {
    title: "Enterprise Knowledge",
    desc: "Operations and enablement teams who need editors to write and developers to not touch it. Role-based access keeps the two worlds separate without a custom permissions system.",
    icon: <BuildingIcon size={24} strokeWidth={1.5} />,
    grid: "col-span-1 md:col-span-6 lg:col-span-8"
  },
  {
    title: "Multi-brand Content Ops",
    desc: "Agencies and SaaS companies managing content across multiple products and domains. One workspace, many sites, zero sync issues. Centralize your copy and assets in one source of truth.",
    icon: <LayersIcon size={24} strokeWidth={1.5} />,
    grid: "col-span-1 md:col-span-6 lg:col-span-6"
  },
  {
    title: "Product Marketing",
    desc: "Marketing teams launching high-conversion landing pages. Define your campaign schema, let editors populate the content, and developers render it on any stack with zero friction.",
    icon: <GlobeIcon size={24} strokeWidth={1.5} />,
    grid: "col-span-1 md:col-span-6 lg:col-span-6"
  }
];

const UseCaseCard = ({ item, i }: { item: typeof CASES[0], i: number }) => {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { damping: 25, stiffness: 200 };
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [6, -6]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-6, 6]), springConfig);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  }

  function handleMouseLeave() {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ 
        rotateX, 
        rotateY, 
        transformStyle: "preserve-3d",
        perspective: 1000
      }}
      className={cn(
        "p-10 bg-paper border border-border rounded-sm group hover:border-accent transition-all hover:shadow-2xl relative overflow-hidden",
        item.grid
      )}
    >
      <div style={{ transform: "translateZ(40px)" }} className="relative z-10">
        <div className="w-12 h-12 bg-accent/5 text-accent border border-accent/10 rounded-sm flex items-center justify-center mb-8 transition-transform group-hover:scale-110 group-hover:bg-accent/10">
          {item.icon}
        </div>
        <h3 className="font-display text-2xl font-semibold text-ink mb-4 transition-colors group-hover:text-accent">{item.title}</h3>
        <p className="text-sm leading-relaxed text-ink-muted font-light">{item.desc}</p>
      </div>
    </motion.div>
  );
};

export const UseCases = () => {
  return (
    <section id="use-cases" className="py-32 px-8 bg-canvas ruled-bg">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-20">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-6">Versatility</p>
          <h2 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-semibold tracking-[-0.03em] leading-[1.1] text-ink mb-8">
            Where <em className="italic text-accent not-italic">precision</em> matters.
          </h2>
          <p className="text-lg font-light leading-[1.6] text-ink-muted max-w-[600px]">
            FlowCMS is designed for projects that demand more than just a place to store text. 
            It&apos;s for builders who care about the bridge between authoring and execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {CASES.map((item, i) => (
            <UseCaseCard key={i} item={item} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
};
