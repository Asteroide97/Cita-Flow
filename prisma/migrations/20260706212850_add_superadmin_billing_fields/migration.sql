-- AlterTable
ALTER TABLE "Clinic" ADD COLUMN     "billingNotes" TEXT,
ADD COLUMN     "billingStatus" TEXT NOT NULL DEFAULT 'TRIAL',
ADD COLUMN     "lastContactedAt" TIMESTAMP(3),
ADD COLUMN     "nextFollowUpAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Clinic_billingStatus_idx" ON "Clinic"("billingStatus");
