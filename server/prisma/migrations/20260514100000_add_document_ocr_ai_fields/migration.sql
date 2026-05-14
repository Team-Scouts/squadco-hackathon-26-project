CREATE TYPE "OcrStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

ALTER TABLE "Document"
  ADD COLUMN "ocrProvider" TEXT,
  ADD COLUMN "ocrStatus" "OcrStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "ocrText" TEXT,
  ADD COLUMN "ocrConfidence" DOUBLE PRECISION,
  ADD COLUMN "aiGeneratedScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "aiGeneratedDetected" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "forensicSignals" JSONB,
  ADD COLUMN "processedAt" TIMESTAMP(3),
  ADD COLUMN "processingError" TEXT;

CREATE INDEX "Document_ocrStatus_idx" ON "Document"("ocrStatus");
