-- AlterTable
ALTER TABLE "WebhookDelivery" ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "responseBody" TEXT,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0;
