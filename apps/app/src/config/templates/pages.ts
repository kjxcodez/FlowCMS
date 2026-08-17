import { Block } from "@/types/cms";

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  blocks: Block[];
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: "landing-page",
    name: "Minimalist Landing",
    description: "Classic hero + features + call to action layout.",
    blocks: [
      { id: "1", type: "heading", props: { level: 1, content: "The Future of Content" } },
      { id: "2", type: "text", props: { content: "Build faster with industrial-grade tools. No bloat, just performance." } },
      { id: "3", type: "cta", props: { label: "Get Started", url: "/auth/register" } },
      { id: "4", type: "divider", props: {} },
      { id: "5", type: "heading", props: { level: 2, content: "Core Features" } },
      { id: "6", type: "text", props: { content: "Enterprise reliability for solo founders." } },
    ]
  },
  {
    id: "saas-homepage",
    name: "SaaS Blueprint",
    description: "Bento-style layout for platform showcases.",
    blocks: [
      { id: "1", type: "heading", props: { level: 1, content: "Infrastructure for the next generation." } },
      { id: "2", type: "image", props: { url: "/hero-preview.png", alt: "App UI Preview" } },
      { id: "3", type: "heading", props: { level: 2, content: "Integrated Caching" } },
      { id: "4", type: "text", props: { content: "Edge-first delivery by default." } },
    ]
  },
  {
    id: "docs-layout",
    name: "Documentation Hub",
    description: "High-readability layout for technical guides.",
    blocks: [
      { id: "1", type: "heading", props: { level: 1, content: "Documentation" } },
      { id: "2", type: "text", props: { content: "Welcome to the knowledge base. Select a topic to begin." } },
      { id: "3", type: "divider", props: {} },
    ]
  },
  {
    id: "product-detail",
    name: "Product Showcase",
    description: "Specs and imagery for e-commerce or features.",
    blocks: [
      { id: "1", type: "image", props: { url: "/product.jpg", alt: "Product Image" } },
      { id: "2", type: "heading", props: { level: 1, content: "Veloce Gear Case" } },
      { id: "3", type: "text", props: { content: "Carbon fiber construction. Industrial durability." } },
      { id: "4", type: "cta", props: { label: "Buy Now", url: "/checkout" } },
    ]
  },
  {
    id: "changelog",
    name: "Timeline Changelog",
    description: "Clean sequential layout for version updates.",
    blocks: [
      { id: "1", type: "heading", props: { level: 1, content: "What's New" } },
      { id: "2", type: "divider", props: {} },
      { id: "3", type: "heading", props: { level: 3, content: "Version 2.4.0" } },
      { id: "4", type: "text", props: { content: "Improved API response times and new billing dashboard." } },
    ]
  },
  {
    id: "about-page",
    name: "Editorial About",
    description: "Typography-first layout for brand storytelling.",
    blocks: [
      { id: "1", type: "heading", props: { level: 1, content: "Built for the builders." } },
      { id: "2", type: "text", props: { content: "FlowCMS was founded on the principle of structural integrity." } },
      { id: "3", type: "image", props: { url: "/team.jpg", alt: "The Founders" } },
    ]
  }
];
