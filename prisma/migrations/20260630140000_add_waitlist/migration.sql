-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('ACTIVE', 'OFFERED', 'CONVERTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WaitlistOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "doctorId" TEXT,
    "preferredDate" TIMESTAMP(3),
    "preferredStartTime" TEXT,
    "preferredEndTime" TEXT,
    "notes" TEXT,
    "autoAccept" BOOLEAN NOT NULL DEFAULT false,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistOffer" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "waitlistEntryId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "offeredStartAt" TIMESTAMP(3) NOT NULL,
    "offeredEndAt" TIMESTAMP(3) NOT NULL,
    "status" "WaitlistOfferStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WaitlistEntry_clinicId_status_createdAt_idx" ON "WaitlistEntry"("clinicId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "WaitlistEntry_clinicId_serviceId_status_createdAt_idx" ON "WaitlistEntry"("clinicId", "serviceId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "WaitlistEntry_clinicId_doctorId_status_createdAt_idx" ON "WaitlistEntry"("clinicId", "doctorId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "WaitlistEntry_patientId_createdAt_idx" ON "WaitlistEntry"("patientId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistOffer_tokenHash_key" ON "WaitlistOffer"("tokenHash");

-- CreateIndex
CREATE INDEX "WaitlistOffer_clinicId_status_expiresAt_idx" ON "WaitlistOffer"("clinicId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "WaitlistOffer_waitlistEntryId_createdAt_idx" ON "WaitlistOffer"("waitlistEntryId", "createdAt");

-- CreateIndex
CREATE INDEX "WaitlistOffer_appointmentId_idx" ON "WaitlistOffer"("appointmentId");

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistOffer" ADD CONSTRAINT "WaitlistOffer_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistOffer" ADD CONSTRAINT "WaitlistOffer_waitlistEntryId_fkey" FOREIGN KEY ("waitlistEntryId") REFERENCES "WaitlistEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistOffer" ADD CONSTRAINT "WaitlistOffer_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
