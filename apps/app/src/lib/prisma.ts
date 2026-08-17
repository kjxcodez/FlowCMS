import "dotenv/config";
import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import type { PoolConfig } from "pg";

/**
 * Runtime database connection — uses Supabase Supavisor transaction pooler (port 6543).
 *
 * DATABASE_URL must point to the transaction pooler with ?pgbouncer=true to disable
 * named prepared statements, which are incompatible with Supabase transaction pooling.
 * Example: postgresql://user:pass@host:6543/db?pgbouncer=true
 *
 * DIRECT_URL (port 5432) is intentionally NOT used here; it is only for Prisma CLI
 * migrations (configured in prisma.config.ts).
 */
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

/**
 * pg.Pool configuration.
 *
 * Pool settings are configured here because @prisma/adapter-pg v7 uses the underlying
 * pg driver for connection pooling — the ?connection_limit= URL parameter no longer
 * applies when using driver adapters (it was a Prisma Rust engine parameter).
 *
 * Pool size reasoning:
 *   - max: 5  → conservative for serverless (Vercel). Each function instance holds at
 *     most 5 client connections to Supavisor. Supavisor then multiplexes those into a
 *     much smaller number of real PostgreSQL backend connections.
 *     Max real connections consumed = max × concurrent instances, all brokered by Supavisor.
 *   - idleTimeoutMillis: 30000  → release idle connections back to Supavisor after 30 s
 *     to avoid accumulating stale, long-lived pooler slots.
 *   - connectionTimeoutMillis: 10000  → surface a clear timeout error (instead of hanging
 *     indefinitely) if Supavisor's client queue is full during a traffic burst.
 */
const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
};

/**
 * Global singleton holders.
 * Storing both `prisma` and `prismaPool` in globalThis prevents Next.js hot-reload from
 * constructing a new PrismaPg adapter (and leaking an orphaned pg.Pool) on every
 * module re-evaluation in development.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaPool: Pool | undefined;
};

// Re-use or create the pg.Pool singleton
if (!globalForPrisma.prismaPool) {
  globalForPrisma.prismaPool = new Pool(poolConfig);
}

const adapter = new PrismaPg(globalForPrisma.prismaPool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
