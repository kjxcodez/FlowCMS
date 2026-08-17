# Contributing to FlowCMS

Thank you for your interest in contributing to FlowCMS!

This guide will help you set up your development environment and outline the standards for submitting contributions.

## Prerequisites

Ensure you have the following installed locally:

- **Node.js**: `>=18` (Node 22 LTS recommended)
- **pnpm**: `^9.0.0` (Use `corepack enable pnpm`)
- **Docker & Docker Compose** (Optional, for running local PostgreSQL)

## Getting Started

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
   Copy `.env.example` to `.env` inside `apps/app`:
   ```bash
   cp apps/app/.env.example apps/app/.env
   ```
   Fill in the required database connection strings (`DATABASE_URL` and `DIRECT_URL`).

4. **Database & Prisma Setup**:
   Generate the Prisma Client:
   ```bash
   cd apps/app
   pnpm prisma generate
   ```

5. **Start Development Server**:
   From the root of the repository:
   ```bash
   pnpm dev
   ```

## Repository Structure

FlowCMS is structured as a pnpm workspace managed with Turborepo:

```text
├── apps/
│   └── app/                 # Main Next.js 15 application (UI, API routes, Prisma schema)
├── scripts/                 # Test suites & utility scripts
├── pnpm-workspace.yaml      # Monorepo workspace configuration
├── turbo.json               # Turborepo task pipeline
└── package.json             # Monorepo root package definition
```

## Available Scripts

Run these from the monorepo root:

- `pnpm dev`: Start the development server with hot-reloading
- `pnpm build`: Build all applications and packages for production
- `pnpm lint`: Run ESLint across all packages
- `pnpm check-types`: Run TypeScript type checking (`tsc --noEmit`)

## Development Guidelines

### Database & Prisma Rules
- Application runtime code **must** use `DATABASE_URL` (Supavisor transaction pooler on port 6543).
- Prisma CLI migrations **must** use `DIRECT_URL` (port 5432).
- Do **not** instantiate multiple `PrismaClient` or `pg.Pool` instances. Always import `prisma` from `@/lib/prisma`.
- Do **not** add `$disconnect()` calls inside Next.js request handlers.

### Code Quality & Formatting
- Ensure all code passes type checking (`pnpm check-types`) and linting (`pnpm lint`) before submitting a PR.
- Never commit `.env` files, credentials, secrets, or API keys.

## Submitting Pull Requests

1. Create a feature branch off `main`: `git checkout -b feature/my-feature`
2. Make your changes and verify with `pnpm check-types` and `pnpm lint`.
3. Push to your fork/branch and open a Pull Request targeting `main`.
4. Ensure the PR template is filled out completely.
