ALTER TABLE "Doctor"
ADD COLUMN     "publicOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "photoUrl" TEXT;

CREATE INDEX "Doctor_clinicId_isActive_isPublic_publicOrder_idx"
ON "Doctor"("clinicId", "isActive", "isPublic", "publicOrder");
