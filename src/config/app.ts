export const APP_CONFIG = {
  name: "FlowCMS",

  tagline: "The headless CMS for developers who hate configuration",

  description:
    "Open-source headless CMS with predictable APIs, visual content modeling, draft previews, and zero setup friction.",

  version: "Early Access Beta",

  url:
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000",

  apiUrl:
    process.env.NEXT_PUBLIC_API_URL ??
    "https://getflowcms.com/api",

  docsUrl:
    "https://getflowcms.com/docs",

  githubUrl:
    "https://github.com/kjxcodez/FlowCMS",

  nav: [
    {
      label:"Docs",
      href:"/docs"
    },
    {
      label:"Features",
      href:"#features"
    },
    {
      label:"Use Cases",
      href:"#use-cases"
    },
    {
      label:"How it works",
      href:"#how-it-works"
    },
    {
      label:"Pricing",
      href:"#pricing"
    },
    {
      label:"FAQ",
      href:"#faq"
    }
  ],

  tickerItems: [
    "Open source",
    "REST API",
    "Next.js ready",
    "Predictable JSON",
    "Draft previews",
    "Webhook support",
    "Multi-environment",
    "API keys",
    "Media library",
    "Content modeling",
    "Workspace support",
    "Developer-first"
  ],

  pricing: [
    {
      plan:"Hobby",

      planKey:"HOBBY",

      price:"₹0",

      period:"Free during beta",

      featured:false,

      cta:"Start Free",

      features:[
        "3 content types",
        "5,000 API requests/mo",
        "1 environment",
        "Basic webhooks"
      ]
    },

    {
      plan:"Pro",

      planKey:"PRO_MONTHLY",

      price:"₹1,999",

      period:"Coming Soon",

      featured:true,

      cta:"Coming Soon",

      features:[
        "Unlimited content types",
        "250,000 API requests/mo",
        "Draft previews",
        "Multiple environments",
        "Advanced webhooks",
        "Priority support"
      ]
    },

    {
      plan:"Agency",

      planKey:"AGENCY_MONTHLY",

      price:"₹6,499",

      period:"Coming Soon",

      featured:false,

      cta:"Coming Soon",

      features:[
        "1,000,000 API requests/mo",
        "Multiple workspaces",
        "Custom roles",
        "White-label dashboard",
        "Advanced permissions",
        "Agency tools"
      ]
    }
  ],

  footerLinks:[
    "Docs",
    "API Reference",
    "Changelog",
    "GitHub",
    "Privacy",
    "Terms"
  ],

  copyright:
    "© FlowCMS"
} as const;