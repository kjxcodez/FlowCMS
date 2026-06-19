/* eslint-disable @typescript-eslint/no-explicit-any */
import test from "node:test";
import assert from "node:assert";
import { prisma } from "../../src/lib/prisma";
import { auth } from "../../src/lib/auth";
import { logger } from "../../src/lib/logger";
import { NextRequest } from "next/server";
import { WorkspaceService } from "../../src/server/services/workspace.service";

// Import route handlers to test
import { POST as apiExplorerPOST } from "../../src/app/api/internal/api-explorer/run/route";
import { POST as onboardingPOST } from "../../src/app/api/internal/onboarding/complete/route";
import { POST as replayPOST } from "../../src/app/api/internal/webhooks/deliveries/[id]/replay/route";
import { PATCH as envPATCH, DELETE as envDELETE } from "../../src/app/api/internal/environments/[envId]/route";

// Save original methods
const originalGetSession = auth.api.getSession;
const originalUserFindUnique = prisma.user.findUnique;
const originalMemberFindFirst = prisma.workspaceMember.findFirst;
const originalCollectionFindFirst = prisma.collection.findFirst;
const originalEnvFindFirst = prisma.environment.findFirst;
const originalEnvDelete = prisma.environment.delete;
const originalEnvUpdate = prisma.environment.update;
const originalDeliveryFindUnique = prisma.webhookDelivery.findUnique;
const originalProvisionWorkspace = WorkspaceService.provisionWorkspace;
const originalLoggerError = logger.error;
const originalConsoleError = console.error;

// Mock session and workspace
interface MockSession {
  user: { id: string; email: string };
  session: { expiresAt: Date };
}

let mockSessionUser: { id: string; email: string } | null = { id: "user-id", email: "editor@example.com" };

auth.api.getSession = (async (): Promise<MockSession | null> => {
  if (mockSessionUser) {
    return {
      user: mockSessionUser,
      session: { expiresAt: new Date(Date.now() + 86400000) },
    };
  }
  return null;
}) as typeof auth.api.getSession;

prisma.user.findUnique = (async (): Promise<any> => {
  return {
    id: "user-id",
    email: "editor@example.com",
    name: "Editor User",
    emailVerified: true,
    onboarded: true,
    image: null,
    isSuspended: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}) as any;

prisma.workspaceMember.findFirst = (async (): Promise<any> => {
  return {
    id: "member-id",
    workspaceId: "ws-id",
    userId: "user-id",
    role: "OWNER",
    createdAt: new Date(),
    workspace: {
      id: "ws-id",
      name: "Mock Workspace",
      slug: "mock-workspace",
      plan: "HOBBY",
    },
  };
}) as any;

// Global tracking for logger and console calls
let loggerErrorCalls: Array<{ msg: string; ctx?: Record<string, unknown> }> = [];
let consoleErrorCalls: any[] = [];

test("Production Logging Hardening — logger.error Regression Tests", async (t) => {
  t.beforeEach(() => {
    loggerErrorCalls = [];
    consoleErrorCalls = [];
    mockSessionUser = { id: "user-id", email: "editor@example.com" };
    
    // Wire up mocks
    logger.error = (msg: string, ctx?: Record<string, unknown>) => {
      loggerErrorCalls.push({ msg, ctx });
    };
    console.error = (...args: any[]) => {
      consoleErrorCalls.push(args);
    };
  });

  t.afterEach(() => {
    // Restore handlers to safe states in case of throw leaks
    prisma.collection.findFirst = originalCollectionFindFirst;
    prisma.environment.findFirst = originalEnvFindFirst;
    prisma.webhookDelivery.findUnique = originalDeliveryFindUnique;
    WorkspaceService.provisionWorkspace = originalProvisionWorkspace;
  });

  await t.test("API Explorer Run Route Exception Redirection", async () => {
    // Mock to throw inside apiExplorerPOST
    prisma.collection.findFirst = (async () => {
      throw new Error("Simulated database explorer failure");
    }) as any;

    const req = new NextRequest("http://localhost/api/internal/api-explorer/run", {
      method: "POST",
      body: JSON.stringify({
        collectionSlug: "test-collection",
      }),
    });

    const res = await apiExplorerPOST(req);
    assert.strictEqual(res.status, 500);
    
    const body = await res.json() as any;
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, "INTERNAL_ERROR");

    // Verify console.error was NOT called
    assert.strictEqual(consoleErrorCalls.length, 0, "console.error should not be called");

    // Verify logger.error was called exactly once with context
    assert.strictEqual(loggerErrorCalls.length, 1, "logger.error should be called once");
    assert.strictEqual(loggerErrorCalls[0].msg, "API Explorer Proxy failure occurred");
    assert.ok(loggerErrorCalls[0].ctx);
    assert.strictEqual(loggerErrorCalls[0].ctx.workspaceId, "ws-id");
    assert.strictEqual(loggerErrorCalls[0].ctx.collectionSlug, "test-collection");
    assert.ok(loggerErrorCalls[0].ctx.error instanceof Error);
    assert.strictEqual((loggerErrorCalls[0].ctx.error as Error).message, "Simulated database explorer failure");
  });

  await t.test("Onboarding Complete Route Exception Redirection", async () => {
    // Mock WorkspaceService.provisionWorkspace to throw
    WorkspaceService.provisionWorkspace = (async () => {
      throw new Error("Simulated provisioning database deadlock");
    }) as any;

    const req = new NextRequest("http://localhost/api/internal/onboarding/complete", {
      method: "POST",
      body: JSON.stringify({
        workspaceName: "My Workspace",
        firstSchemaName: "Blog Post",
      }),
    });

    const res = await onboardingPOST(req);
    assert.strictEqual(res.status, 500);

    const body = await res.json() as any;
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, "INTERNAL_ERROR");

    // Verify console.error was NOT called
    assert.strictEqual(consoleErrorCalls.length, 0, "console.error should not be called");

    // Verify logger.error was called exactly once with context
    assert.strictEqual(loggerErrorCalls.length, 1, "logger.error should be called once");
    assert.strictEqual(loggerErrorCalls[0].msg, "Atomic complete onboarding route failure occurred");
    assert.ok(loggerErrorCalls[0].ctx);
    assert.strictEqual(loggerErrorCalls[0].ctx.userId, "user-id");
    assert.ok(loggerErrorCalls[0].ctx.error instanceof Error);
    assert.strictEqual((loggerErrorCalls[0].ctx.error as Error).message, "Simulated provisioning database deadlock");
  });

  await t.test("Webhook Deliveries Replay Route Exception Redirection", async () => {
    // Mock to throw
    prisma.webhookDelivery.findUnique = (async () => {
      throw new Error("Simulated webhook delivery database crash");
    }) as any;

    const req = new NextRequest("http://localhost/api/internal/webhooks/deliveries/delivery-123/replay", {
      method: "POST",
    });

    const res = await replayPOST(req, { params: Promise.resolve({ id: "delivery-123" }) });
    assert.strictEqual(res.status, 500);

    const body = await res.json() as any;
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, "INTERNAL_ERROR");

    // Verify console.error was NOT called
    assert.strictEqual(consoleErrorCalls.length, 0, "console.error should not be called");

    // Verify logger.error was called exactly once with context
    assert.strictEqual(loggerErrorCalls.length, 1, "logger.error should be called once");
    assert.strictEqual(loggerErrorCalls[0].msg, "Manual webhook replay exception occurred");
    assert.ok(loggerErrorCalls[0].ctx);
    assert.strictEqual(loggerErrorCalls[0].ctx.workspaceId, "ws-id");
    assert.strictEqual(loggerErrorCalls[0].ctx.deliveryId, "delivery-123");
    assert.ok(loggerErrorCalls[0].ctx.error instanceof Error);
    assert.strictEqual((loggerErrorCalls[0].ctx.error as Error).message, "Simulated webhook delivery database crash");
  });

  await t.test("Environment Update Route Exception Redirection", async () => {
    // Mock to throw
    prisma.environment.findFirst = (async () => {
      throw new Error("Simulated environment lookup exception");
    }) as any;

    const req = new NextRequest("http://localhost/api/internal/environments/env-123", {
      method: "PATCH",
      body: JSON.stringify({ name: "Staging" }),
    });

    const res = await envPATCH(req, { params: Promise.resolve({ envId: "env-123" }) });
    assert.strictEqual(res.status, 500);

    const body = await res.json() as any;
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, "INTERNAL_ERROR");

    // Verify console.error was NOT called
    assert.strictEqual(consoleErrorCalls.length, 0, "console.error should not be called");

    // Verify logger.error was called exactly once with context
    assert.strictEqual(loggerErrorCalls.length, 1, "logger.error should be called once");
    assert.strictEqual(loggerErrorCalls[0].msg, "Environment update failed");
    assert.ok(loggerErrorCalls[0].ctx);
    assert.strictEqual(loggerErrorCalls[0].ctx.workspaceId, "ws-id");
    assert.strictEqual(loggerErrorCalls[0].ctx.environmentId, "env-123");
    assert.ok(loggerErrorCalls[0].ctx.error instanceof Error);
    assert.strictEqual((loggerErrorCalls[0].ctx.error as Error).message, "Simulated environment lookup exception");
  });

  await t.test("Environment Delete Route Exception Redirection", async () => {
    // Mock to throw
    prisma.environment.findFirst = (async () => {
      throw new Error("Simulated environment lookup exception during deletion");
    }) as any;

    const req = new NextRequest("http://localhost/api/internal/environments/env-123", {
      method: "DELETE",
    });

    const res = await envDELETE(req, { params: Promise.resolve({ envId: "env-123" }) });
    assert.strictEqual(res.status, 500);

    const body = await res.json() as any;
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, "INTERNAL_ERROR");

    // Verify console.error was NOT called
    assert.strictEqual(consoleErrorCalls.length, 0, "console.error should not be called");

    // Verify logger.error was called exactly once with context
    assert.strictEqual(loggerErrorCalls.length, 1, "logger.error should be called once");
    assert.strictEqual(loggerErrorCalls[0].msg, "Environment delete failed");
    assert.ok(loggerErrorCalls[0].ctx);
    assert.strictEqual(loggerErrorCalls[0].ctx.workspaceId, "ws-id");
    assert.strictEqual(loggerErrorCalls[0].ctx.environmentId, "env-123");
    assert.ok(loggerErrorCalls[0].ctx.error instanceof Error);
    assert.strictEqual((loggerErrorCalls[0].ctx.error as Error).message, "Simulated environment lookup exception during deletion");
  });

  t.after(() => {
    // Restore originals
    auth.api.getSession = originalGetSession;
    prisma.user.findUnique = originalUserFindUnique;
    prisma.workspaceMember.findFirst = originalMemberFindFirst;
    prisma.collection.findFirst = originalCollectionFindFirst;
    prisma.environment.findFirst = originalEnvFindFirst;
    prisma.environment.delete = originalEnvDelete;
    prisma.environment.update = originalEnvUpdate;
    prisma.webhookDelivery.findUnique = originalDeliveryFindUnique;
    WorkspaceService.provisionWorkspace = originalProvisionWorkspace;
    logger.error = originalLoggerError;
    console.error = originalConsoleError;
  });
});
