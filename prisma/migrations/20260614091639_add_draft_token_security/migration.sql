-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'DRAFT_TOKEN_USED';
ALTER TYPE "AuditAction" ADD VALUE 'DRAFT_TOKEN_FAILED';

-- AlterTable
ALTER TABLE "DraftToken" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowedCollectionId" TEXT,
ADD COLUMN     "allowedEntryId" TEXT,
ADD COLUMN     "environmentId" TEXT;

-- AddForeignKey
ALTER TABLE "DraftToken" ADD CONSTRAINT "DraftToken_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
