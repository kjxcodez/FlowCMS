-- AlterTable
ALTER TABLE "Webhook" ADD COLUMN     "environmentId" TEXT;

-- CreateIndex
CREATE INDEX "ApiKey_workspaceId_environmentId_idx" ON "ApiKey"("workspaceId", "environmentId");

-- CreateIndex
CREATE INDEX "Entry_workspaceId_environmentId_idx" ON "Entry"("workspaceId", "environmentId");

-- CreateIndex
CREATE INDEX "Entry_collectionId_environmentId_idx" ON "Entry"("collectionId", "environmentId");

-- CreateIndex
CREATE INDEX "Entry_status_environmentId_idx" ON "Entry"("status", "environmentId");

-- CreateIndex
CREATE INDEX "Webhook_workspaceId_environmentId_idx" ON "Webhook"("workspaceId", "environmentId");

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
