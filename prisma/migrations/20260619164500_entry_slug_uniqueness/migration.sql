-- DropIndex
DROP INDEX "Entry_collectionId_slug_key";

-- CreateIndex
CREATE UNIQUE INDEX "Entry_collectionId_environmentId_slug_key" ON "Entry"("collectionId", "environmentId", "slug");
