/*
  Warnings:

  - The values [INDIE_DEV,OTHER] on the enum `WaitlistRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "WaitlistRole_new" AS ENUM ('SOLO_DEV', 'TEAM_DEV', 'AGENCY', 'FOUNDER', 'STUDENT', 'OPEN_SOURCE_MAINTAINER');
ALTER TABLE "WaitlistEntry" ALTER COLUMN "role" TYPE "WaitlistRole_new" USING ("role"::text::"WaitlistRole_new");
ALTER TYPE "WaitlistRole" RENAME TO "WaitlistRole_old";
ALTER TYPE "WaitlistRole_new" RENAME TO "WaitlistRole";
DROP TYPE "public"."WaitlistRole_old";
COMMIT;
