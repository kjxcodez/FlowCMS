-- AlterTable
ALTER TABLE "RazorpayCustomer" ADD COLUMN     "lastEventAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "inviteToken" TEXT;
