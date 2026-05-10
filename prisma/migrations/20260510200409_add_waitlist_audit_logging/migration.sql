-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'WAITLIST_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE 'WAITLIST_INVITED';
ALTER TYPE "AuditAction" ADD VALUE 'WAITLIST_REVOKED';
ALTER TYPE "AuditAction" ADD VALUE 'WAITLIST_SUSPENDED';
ALTER TYPE "AuditAction" ADD VALUE 'WAITLIST_RESTORED';

-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "workspaceId" DROP NOT NULL;
