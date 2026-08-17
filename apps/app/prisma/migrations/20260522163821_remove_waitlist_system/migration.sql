/*
  Warnings:

  - The values [WAITLIST_APPROVED,WAITLIST_INVITED,WAITLIST_REVOKED,WAITLIST_SUSPENDED,WAITLIST_RESTORED] on the enum `AuditAction` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `waitlistEntryId` on the `EmailLog` table. All the data in the column will be lost.
  - You are about to drop the column `inviteToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `WaitlistEntry` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'UNPUBLISH', 'ARCHIVE', 'API_KEY_CREATED', 'API_KEY_REVOKED', 'WEBHOOK_FIRED', 'MEMBER_INVITED', 'MEMBER_REMOVED', 'PLAN_CHANGED', 'WEBHOOK_CREATED', 'WEBHOOK_DELETED');
ALTER TABLE "AuditLog" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "public"."AuditAction_old";
COMMIT;

-- AlterTable
ALTER TABLE "EmailLog" DROP COLUMN "waitlistEntryId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "inviteToken";

-- DropTable
DROP TABLE "WaitlistEntry";

-- DropEnum
DROP TYPE "WaitlistPriority";

-- DropEnum
DROP TYPE "WaitlistRole";

-- DropEnum
DROP TYPE "WaitlistStatus";
