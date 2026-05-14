CREATE TYPE "DocumentVerificationStatus" AS ENUM ('PENDING', 'NEEDS_REVIEW', 'VERIFIED', 'REJECTED');

ALTER TABLE "Document"
  ADD COLUMN "verificationStatus" "DocumentVerificationStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "duplicateDetected" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "duplicateVendorCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "extractedFields" JSONB,
  ADD COLUMN "verificationReasons" JSONB,
  ADD COLUMN "reviewNotes" TEXT,
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Document_vendorId_idx" ON "Document"("vendorId");
CREATE INDEX "Document_documentHash_idx" ON "Document"("documentHash");
CREATE INDEX "Document_verificationStatus_idx" ON "Document"("verificationStatus");
