import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const withMDX = createMDX();


const nextConfig: NextConfig = {};

export default withSentryConfig(withMDX(nextConfig), {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "flowcms",
  project: "flowcms-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your Sentry bill.
  tunnelRoute: "/monitoring",

  // Hides source maps from visitors
  // Note: hideSourceMaps is handled via separate build flags or different config structure in latest SDK


  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with `appDir`, see docs)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});

