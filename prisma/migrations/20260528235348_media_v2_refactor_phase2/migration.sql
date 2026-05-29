/*
  Warnings:

  - You are about to drop the column `folder` on the `Media` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Media_workspaceId_folder_idx";

-- AlterTable
ALTER TABLE "Media" DROP COLUMN "folder";
