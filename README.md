# FlowCMS

FlowCMS is a modern, headless Content Management System (CMS) built with Next.js, TypeScript, Prisma ORM, and Supabase PostgreSQL.

## Features

- **Content Management**: Structured and visual collections for managing entries, media, and environments.
- **Authentication**: Powered by Better Auth with support for email/password and OAuth (Google).
- **Database & Pooling**: Prisma ORM with `@prisma/adapter-pg` configured for Supabase Supavisor connection pooling.
- **API & Webhooks**: Headless API endpoints (`/api/v1`) with background webhook delivery powered by Upstash QStash.
- **Billing & Usage**: Integrated Razorpay billing and rate limiting via Upstash Redis.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **ORM**: [Prisma ORM 7](https://www.prisma.io/) with `@prisma/adapter-pg`
- **Database**: [Supabase PostgreSQL](https://supabase.com/) with Supavisor Pooler
- **Monorepo Engine**: [Turborepo](https://turbo.build/) & [pnpm](https://pnpm.io/)
- **UI & Styling**: Tailwind CSS, Radix UI / Base UI, Motion, Lucide Icons

## Getting Started

### Prerequisites

- Node.js `>=18` (Node 22 LTS recommended)
- pnpm `^9.0.0` (`corepack enable pnpm`)

### Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kjxcodez/FlowCMS.git
   cd FlowCMS
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` in `apps/app`:
   ```bash
   cp apps/app/.env.example apps/app/.env
   ```

4. **Generate Prisma Client**:
   ```bash
   cd apps/app && pnpm prisma generate
   ```

5. **Run Development Server**:
   From the repository root:
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Monorepo Commands

- `pnpm dev`: Run local development server
- `pnpm build`: Build all packages for production
- `pnpm lint`: Run ESLint checks
- `pnpm check-types`: Run TypeScript compiler type checking (`tsc --noEmit`)

## Contributing & Governance

- Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for development rules and guidelines.
- To report security vulnerabilities, review [SECURITY.md](./SECURITY.md).
