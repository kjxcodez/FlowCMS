"use client";

import React from "react";
import { CheckIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const COMPARISON_DATA = [
  {
    feature: "Self-hostable",
    flow: true,
    sanity: false,
    strapi: true,
    contentful: false,
  },
  {
    feature: "Open Source (MIT)",
    flow: true,
    sanity: false,
    strapi: "Partial",
    contentful: false,
  },
  {
    feature: "Visual Block Editor",
    flow: true,
    sanity: true,
    strapi: true,
    contentful: true,
  },
  {
    feature: "Zero-config Setup",
    flow: true,
    sanity: false,
    strapi: false,
    contentful: true,
  },
  {
    feature: "REST & GraphQL",
    flow: true,
    sanity: true,
    strapi: true,
    contentful: true,
  },
  {
    feature: "Predictable Pricing",
    flow: "Flat/Usage",
    sanity: "Usage-heavy",
    strapi: "Tiered",
    contentful: "Usage-heavy",
  },
];

const Status = ({ value }: { value: boolean | string }) => {
  if (value === true) return <CheckIcon className="size-4 text-success mx-auto" />;
  if (value === false) return <XIcon className="size-4 text-destructive mx-auto opacity-40" />;
  return <span className="text-[11px] font-medium text-ink-muted">{value}</span>;
};

export const Comparison = () => {
  return (
    <section id="comparison" className="py-32 px-8 bg-paper">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-20">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-6">Market Context</p>
          <h2 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-semibold tracking-[-0.03em] leading-[1.1] text-ink mb-8">
            How we <em className="italic text-accent not-italic">stack up</em>.
          </h2>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-6 text-left border-b-2 border-border-strong font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">Feature</th>
                <th className="p-6 border-b-2 border-accent bg-accent-bright/5">
                  <div className="flex flex-col items-center">
                    <span className="font-display text-lg font-bold text-ink">FlowCMS</span>
                    <span className="font-mono text-[9px] font-bold text-accent uppercase tracking-widest mt-1">Recommended</span>
                  </div>
                </th>
                <th className="p-6 border-b-2 border-border-strong text-ink-muted/60 font-display text-base">Sanity</th>
                <th className="p-6 border-b-2 border-border-strong text-ink-muted/60 font-display text-base">Strapi</th>
                <th className="p-6 border-b-2 border-border-strong text-ink-muted/60 font-display text-base">Contentful</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_DATA.map((row, i) => (
                <tr key={i} className="group hover:bg-canvas transition-colors">
                  <td className="p-6 border-b border-border font-ui text-sm font-medium text-ink">{row.feature}</td>
                  <td className="p-6 border-b border-border bg-accent-bright/5 text-center">
                    <Status value={row.flow} />
                  </td>
                  <td className="p-6 border-b border-border text-center">
                    <Status value={row.sanity} />
                  </td>
                  <td className="p-6 border-b border-border text-center">
                    <Status value={row.strapi} />
                  </td>
                  <td className="p-6 border-b border-border text-center">
                    <Status value={row.contentful} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <p className="mt-8 text-center text-[11px] text-ink-muted font-light italic">
          * Based on core feature sets as of Q2 2024. Competitor logos are for identification only.
        </p>
      </div>
    </section>
  );
};
