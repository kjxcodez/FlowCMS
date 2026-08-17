import { FieldDefinition } from "@/types/cms";

export interface CollectionTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: "marketing" | "saas" | "product";
  fields: FieldDefinition[];
}

export const COLLECTION_TEMPLATES: CollectionTemplate[] = [
  // --- Marketing ---
  {
    id: "blog-post",
    name: "Blog Post",
    slug: "blog-post",
    description: "Standard editorial article with metadata and rich content.",
    category: "marketing",
    fields: [
      { id: "1", name: "Title", slug: "title", type: "text", required: true, multiple: false },
      { id: "2", name: "Content", slug: "content", type: "richtext", required: true, multiple: false },
      { id: "4", name: "Featured Image", slug: "featured-image", type: "media", required: false, multiple: false },
      { id: "5", name: "Excerpt", slug: "excerpt", type: "textarea", required: false, multiple: false },
      { id: "6", name: "Publish Date", slug: "publish-date", type: "date", required: true, multiple: false },
    ]
  },
  {
    id: "author",
    name: "Author",
    slug: "author",
    description: "Profiles for content creators.",
    category: "marketing",
    fields: [
      { id: "1", name: "Name", slug: "name", type: "text", required: true, multiple: false },
      { id: "2", name: "Avatar", slug: "avatar", type: "media", required: true, multiple: false },
      { id: "3", name: "Bio", slug: "bio", type: "textarea", required: false, multiple: false },
      { id: "4", name: "Twitter", slug: "twitter", type: "text", required: false, multiple: false },
    ]
  },
  {
    id: "category",
    name: "Category",
    slug: "category",
    description: "Taxonomy for grouping content.",
    category: "marketing",
    fields: [
      { id: "1", name: "Name", slug: "name", type: "text", required: true, multiple: false },
      { id: "3", name: "Description", slug: "description", type: "textarea", required: false, multiple: false },
    ]
  },
  {
    id: "case-study",
    name: "Case Study",
    slug: "case-study",
    description: "Detailed success stories with metrics.",
    category: "marketing",
    fields: [
      { id: "1", name: "Company", slug: "company", type: "text", required: true, multiple: false },
      { id: "2", name: "Title", slug: "title", type: "text", required: true, multiple: false },
      { id: "3", name: "Logo", slug: "logo", type: "media", required: true, multiple: false },
      { id: "4", name: "Content", slug: "content", type: "richtext", required: true, multiple: false },
      { id: "5", name: "Success Metric", slug: "metric", type: "text", required: false, multiple: false },
    ]
  },

  // --- SaaS ---
  {
    id: "feature",
    name: "Product Feature",
    slug: "feature",
    description: "Showcase platform capabilities with icons.",
    category: "saas",
    fields: [
      { id: "1", name: "Title", slug: "title", type: "text", required: true, multiple: false },
      { id: "2", name: "Description", slug: "description", type: "textarea", required: true, multiple: false },
      { id: "3", name: "Icon Name", slug: "icon", type: "text", required: false, multiple: false },
      { id: "4", name: "Documentation Link", slug: "doc-link", type: "text", required: false, multiple: false },
    ]
  },
  {
    id: "pricing-tier",
    name: "Pricing Tier",
    slug: "pricing-tier",
    description: "Subscription plans and feature lists.",
    category: "saas",
    fields: [
      { id: "1", name: "Plan Name", slug: "name", type: "text", required: true, multiple: false },
      { id: "2", name: "Price Monthly", slug: "price-mo", type: "number", required: true, multiple: false },
      { id: "3", name: "Features", slug: "features", type: "text", required: true, multiple: true },
      { id: "4", name: "Is Popular", slug: "is-popular", type: "boolean", required: false, multiple: false },
    ]
  },
  {
    id: "testimonial",
    name: "Testimonial",
    slug: "testimonial",
    description: "Social proof from customers.",
    category: "saas",
    fields: [
      { id: "1", name: "Quote", slug: "quote", type: "textarea", required: true, multiple: false },
      { id: "2", name: "Customer Name", slug: "customer", type: "text", required: true, multiple: false },
      { id: "3", name: "Title / Role", slug: "role", type: "text", required: true, multiple: false },
      { id: "4", name: "Company", slug: "company", type: "text", required: false, multiple: false },
      { id: "5", name: "Avatar", slug: "avatar", type: "media", required: false, multiple: false },
    ]
  },
  {
    id: "faq",
    name: "FAQ Item",
    slug: "faq",
    description: "Standard Q&A for support.",
    category: "saas",
    fields: [
      { id: "1", name: "Question", slug: "question", type: "text", required: true, multiple: false },
      { id: "2", name: "Answer", slug: "answer", type: "richtext", required: true, multiple: false },
    ]
  },

  // --- Product ---
  {
    id: "docs-page",
    name: "Docs Page",
    slug: "docs-page",
    description: "Structured technical documentation.",
    category: "product",
    fields: [
      { id: "1", name: "Title", slug: "title", type: "text", required: true, multiple: false },
      { id: "2", name: "Category", slug: "category", type: "text", required: true, multiple: false },
      { id: "3", name: "Content", slug: "content", type: "richtext", required: true, multiple: false },
      { id: "4", name: "Order", slug: "order", type: "number", required: false, multiple: false },
    ]
  },
  {
    id: "changelog",
    name: "Changelog Entry",
    slug: "changelog",
    description: "Versioned updates and fixes.",
    category: "product",
    fields: [
      { id: "1", name: "Version", slug: "version", type: "text", required: true, multiple: false },
      { id: "2", name: "Notes", slug: "notes", type: "richtext", required: true, multiple: false },
      { id: "3", name: "Release Date", slug: "date", type: "date", required: true, multiple: false },
    ]
  },
  {
    id: "job-posting",
    name: "Job Posting",
    slug: "job-posting",
    description: "Career opportunities and requirements.",
    category: "product",
    fields: [
      { id: "1", name: "Role Title", slug: "title", type: "text", required: true, multiple: false },
      { id: "2", name: "Location", slug: "location", type: "text", required: true, multiple: false },
      { id: "3", name: "Salary Range", slug: "salary", type: "text", required: false, multiple: false },
      { id: "4", name: "Description", slug: "description", type: "richtext", required: true, multiple: false },
    ]
  },
  {
    id: "team-member",
    name: "Team Member",
    slug: "team-member",
    description: "The people behind the product.",
    category: "product",
    fields: [
      { id: "1", name: "Name", slug: "name", type: "text", required: true, multiple: false },
      { id: "2", name: "Position", slug: "position", type: "text", required: true, multiple: false },
      { id: "3", name: "Bio", slug: "bio", type: "textarea", required: false, multiple: false },
      { id: "4", name: "Headshot", slug: "photo", type: "media", required: true, multiple: false },
    ]
  }
];
