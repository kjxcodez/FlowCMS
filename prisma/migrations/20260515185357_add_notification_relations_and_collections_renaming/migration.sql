/*
  Warnings:

  - You are about to drop the column `contentTypeId` on the `Entry` table. All the data in the column will be lost.
  - You are about to drop the column `contentTypes` on the `MonthlyUsage` table. All the data in the column will be lost.
  - You are about to drop the `ContentType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContentTypeTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Page` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[collectionId,slug]` on the table `Entry` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `collectionId` to the `Entry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Entry` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CollectionMode" AS ENUM ('STRUCTURED', 'VISUAL');

-- DropForeignKey
ALTER TABLE "ContentType" DROP CONSTRAINT "ContentType_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "Entry" DROP CONSTRAINT "Entry_contentTypeId_fkey";

-- DropForeignKey
ALTER TABLE "Page" DROP CONSTRAINT "Page_environmentId_fkey";

-- DropForeignKey
ALTER TABLE "Page" DROP CONSTRAINT "Page_workspaceId_fkey";

-- DropIndex
DROP INDEX "Entry_contentTypeId_status_idx";

-- AlterTable
ALTER TABLE "ApiKey" ALTER COLUMN "scopes" SET DEFAULT ARRAY['read:entries', 'read:media']::TEXT[];

-- AlterTable
ALTER TABLE "Entry" DROP COLUMN "contentTypeId",
ADD COLUMN     "collectionId" TEXT NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MonthlyUsage" DROP COLUMN "contentTypes",
ADD COLUMN     "collections" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "ContentType";

-- DropTable
DROP TABLE "ContentTypeTemplate";

-- DropTable
DROP TABLE "Page";

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "mode" "CollectionMode" NOT NULL DEFAULT 'STRUCTURED',
    "fields" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "previewData" JSONB,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Collection_workspaceId_slug_key" ON "Collection"("workspaceId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionTemplate_slug_key" ON "CollectionTemplate"("slug");

-- CreateIndex
CREATE INDEX "Notification_workspaceId_read_idx" ON "Notification"("workspaceId", "read");

-- CreateIndex
CREATE INDEX "Entry_collectionId_status_idx" ON "Entry"("collectionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_collectionId_slug_key" ON "Entry"("collectionId", "slug");

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
