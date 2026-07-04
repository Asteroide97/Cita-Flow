ALTER TABLE "Service"
ADD COLUMN     "category" TEXT,
ADD COLUMN     "publicOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "Service_clinicId_isActive_isPublic_publicOrder_idx"
ON "Service"("clinicId", "isActive", "isPublic", "publicOrder");
