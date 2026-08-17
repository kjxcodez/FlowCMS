/*
  Warnings:

  - You are about to drop the column `permissions` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the column `prefix` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the column `apiId` on the `ContentType` table. All the data in the column will be lost.
  - You are about to drop the column `altText` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the column `caption` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the column `originalName` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the column `storagePath` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedById` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Workspace` table. All the data in the column will be lost.
  - You are about to drop the column `logoUrl` on the `Workspace` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `Workspace` table. All the data in the column will be lost.
  - The `role` column on the `WorkspaceMember` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Content` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[workspaceId,slug]` on the table `ContentType` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `keyPrefix` to the `ApiKey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `ContentType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filename` to the `Media` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('HOBBY', 'PRO', 'TEAM');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WebhookEvent" AS ENUM ('ENTRY_CREATED', 'ENTRY_UPDATED', 'ENTRY_PUBLISHED', 'ENTRY_DELETED', 'PAGE_CREATED', 'PAGE_UPDATED', 'PAGE_PUBLISHED', 'PAGE_DELETED');

-- DropForeignKey
ALTER TABLE "ApiKey" DROP CONSTRAINT "ApiKey_userId_fkey";

-- DropForeignKey
ALTER TABLE "Content" DROP CONSTRAINT "Content_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Content" DROP CONSTRAINT "Content_contentTypeId_fkey";

-- DropForeignKey
ALTER TABLE "Content" DROP CONSTRAINT "Content_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "Media" DROP CONSTRAINT "Media_uploadedById_fkey";

-- DropForeignKey
ALTER TABLE "Workspace" DROP CONSTRAINT "Workspace_ownerId_fkey";

-- DropIndex
DROP INDEX "Account_providerId_accountId_key";

-- DropIndex
DROP INDEX "ContentType_workspaceId_apiId_key";

-- DropIndex
DROP INDEX "Verification_identifier_value_key";

-- AlterTable
ALTER TABLE "ApiKey" DROP COLUMN "permissions",
DROP COLUMN "prefix",
DROP COLUMN "userId",
ADD COLUMN     "keyPrefix" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ContentType" DROP COLUMN "apiId",
ADD COLUMN     "slug" TEXT NOT NULL,
ALTER COLUMN "fields" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Media" DROP COLUMN "altText",
DROP COLUMN "caption",
DROP COLUMN "metadata",
DROP COLUMN "name",
DROP COLUMN "originalName",
DROP COLUMN "storagePath",
DROP COLUMN "updatedAt",
DROP COLUMN "uploadedById",
ADD COLUMN     "alt" TEXT,
ADD COLUMN     "filename" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Workspace" DROP COLUMN "description",
DROP COLUMN "logoUrl",
DROP COLUMN "ownerId",
ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'HOBBY';

-- AlterTable
ALTER TABLE "WorkspaceMember" DROP COLUMN "role",
ADD COLUMN     "role" "MemberRole" NOT NULL DEFAULT 'EDITOR';

-- DropTable
DROP TABLE "Content";

-- DropEnum
DROP TYPE "ContentStatus";

-- DropEnum
DROP TYPE "WorkspaceRole";

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "contentTypeId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "status" "EntryStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "blocks" JSONB NOT NULL,
    "status" "EntryStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDesc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" "WebhookEvent"[],
    "secret" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "statusCode" INTEGER,
    "success" BOOLEAN NOT NULL,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "apiKeyId" TEXT,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "cacheHit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyUsage" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "apiRequests" INTEGER NOT NULL DEFAULT 0,
    "storageBytes" INTEGER NOT NULL DEFAULT 0,
    "contentTypes" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Page_workspaceId_slug_key" ON "Page"("workspaceId", "slug");

-- CreateIndex
CREATE INDEX "UsageLog_workspaceId_createdAt_idx" ON "UsageLog"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "UsageLog_workspaceId_apiKeyId_idx" ON "UsageLog"("workspaceId", "apiKeyId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyUsage_workspaceId_year_month_key" ON "MonthlyUsage"("workspaceId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "ContentType_workspaceId_slug_key" ON "ContentType"("workspaceId", "slug");

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_contentTypeId_fkey" FOREIGN KEY ("contentTypeId") REFERENCES "ContentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "Webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageLog" ADD CONSTRAINT "UsageLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyUsage" ADD CONSTRAINT "MonthlyUsage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
