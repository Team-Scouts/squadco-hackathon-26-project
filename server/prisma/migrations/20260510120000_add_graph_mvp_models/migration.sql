-- AlterEnum
ALTER TYPE "RiskLevel" ADD VALUE IF NOT EXISTS 'CRITICAL';

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "bankCode" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumberHash" TEXT NOT NULL,
    "accountNumberLast4" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "lookupStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "identityMatchScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "transferReference" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "transactionReference" TEXT,
    "transferReference" TEXT,
    "rawPayload" JSONB NOT NULL,
    "signature" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "graphSynced" BOOLEAN NOT NULL DEFAULT false,
    "graphSyncAttempts" INTEGER NOT NULL DEFAULT 0,
    "graphSyncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskScore" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "documentRisk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "networkFraudRisk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "financialAnomalyRisk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deviceRisk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "identityMismatchRisk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "manualReviewPenalty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallRisk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskLevel" "RiskLevel" NOT NULL,
    "recommendedAction" TEXT NOT NULL,
    "reasons" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GraphSyncFailure" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "operation" TEXT NOT NULL,
    "error" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GraphSyncFailure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BankAccount_vendorId_idx" ON "BankAccount"("vendorId");

-- CreateIndex
CREATE INDEX "BankAccount_accountNumberHash_idx" ON "BankAccount"("accountNumberHash");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_transferReference_key" ON "Transfer"("transferReference");

-- CreateIndex
CREATE INDEX "Transfer_vendorId_idx" ON "Transfer"("vendorId");

-- CreateIndex
CREATE INDEX "Transfer_bankAccountId_idx" ON "Transfer"("bankAccountId");

-- CreateIndex
CREATE INDEX "WebhookEvent_provider_idx" ON "WebhookEvent"("provider");

-- CreateIndex
CREATE INDEX "WebhookEvent_eventType_idx" ON "WebhookEvent"("eventType");

-- CreateIndex
CREATE INDEX "WebhookEvent_transactionReference_idx" ON "WebhookEvent"("transactionReference");

-- CreateIndex
CREATE INDEX "WebhookEvent_transferReference_idx" ON "WebhookEvent"("transferReference");

-- CreateIndex
CREATE INDEX "WebhookEvent_graphSynced_idx" ON "WebhookEvent"("graphSynced");

-- CreateIndex
CREATE INDEX "RiskScore_vendorId_idx" ON "RiskScore"("vendorId");

-- CreateIndex
CREATE INDEX "RiskScore_riskLevel_idx" ON "RiskScore"("riskLevel");

-- CreateIndex
CREATE INDEX "GraphSyncFailure_entityType_entityId_idx" ON "GraphSyncFailure"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "GraphSyncFailure_resolved_idx" ON "GraphSyncFailure"("resolved");

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_transactionReference_fkey" FOREIGN KEY ("transactionReference") REFERENCES "Transaction"("transactionRef") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_transferReference_fkey" FOREIGN KEY ("transferReference") REFERENCES "Transfer"("transferReference") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskScore" ADD CONSTRAINT "RiskScore_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
