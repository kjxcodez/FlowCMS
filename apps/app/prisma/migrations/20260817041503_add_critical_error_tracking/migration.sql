-- CreateEnum
CREATE TYPE "ErrorStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'IGNORED');

-- CreateTable
CREATE TABLE "CriticalError" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "errorName" TEXT,
    "message" TEXT NOT NULL,
    "route" TEXT,
    "method" TEXT,
    "environment" TEXT,
    "deploymentId" TEXT,
    "requestId" TEXT,
    "operation" TEXT,
    "userId" TEXT,
    "workspaceId" TEXT,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ErrorStatus" NOT NULL DEFAULT 'OPEN',
    "stack" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CriticalError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CriticalError_fingerprint_key" ON "CriticalError"("fingerprint");

-- CreateIndex
CREATE INDEX "CriticalError_lastSeenAt_idx" ON "CriticalError"("lastSeenAt");

-- CreateIndex
CREATE INDEX "CriticalError_status_idx" ON "CriticalError"("status");

-- CreateIndex
CREATE INDEX "CriticalError_workspaceId_idx" ON "CriticalError"("workspaceId");

-- AddForeignKey
ALTER TABLE "CriticalError" ADD CONSTRAINT "CriticalError_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
