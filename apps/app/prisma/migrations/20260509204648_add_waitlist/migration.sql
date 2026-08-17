-- CreateEnum
CREATE TYPE "WaitlistRole" AS ENUM ('INDIE_DEV', 'AGENCY', 'FOUNDER', 'OTHER');

-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('PENDING', 'CONFIRMED', 'APPROVED', 'INVITED', 'JOINED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WaitlistPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'IMMEDIATE');

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "WaitlistRole",
    "useCase" TEXT,
    "source" TEXT,
    "referredBy" TEXT,
    "position" INTEGER NOT NULL,
    "priority" "WaitlistPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "WaitlistStatus" NOT NULL DEFAULT 'PENDING',
    "inviteToken" TEXT,
    "inviteSentAt" TIMESTAMP(3),
    "inviteUsedAt" TIMESTAMP(3),
    "inviteExpiresAt" TIMESTAMP(3),
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "referralCode" TEXT,
    "referralCount" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_email_key" ON "WaitlistEntry"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_inviteToken_key" ON "WaitlistEntry"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_referralCode_key" ON "WaitlistEntry"("referralCode");

-- CreateIndex
CREATE INDEX "WaitlistEntry_status_joinedAt_idx" ON "WaitlistEntry"("status", "joinedAt");

-- CreateIndex
CREATE INDEX "WaitlistEntry_priority_joinedAt_idx" ON "WaitlistEntry"("priority", "joinedAt");

-- CreateIndex
CREATE INDEX "WaitlistEntry_inviteToken_idx" ON "WaitlistEntry"("inviteToken");

-- CreateIndex
CREATE INDEX "WaitlistEntry_referralCode_idx" ON "WaitlistEntry"("referralCode");
