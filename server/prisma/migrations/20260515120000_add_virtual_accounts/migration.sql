-- CreateTable
CREATE TABLE "VirtualAccount" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'squad',
    "customerIdentifier" TEXT NOT NULL,
    "virtualAccountNumber" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VirtualAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VirtualAccount_provider_virtualAccountNumber_key" ON "VirtualAccount"("provider", "virtualAccountNumber");

-- CreateIndex
CREATE INDEX "VirtualAccount_vendorId_idx" ON "VirtualAccount"("vendorId");

-- CreateIndex
CREATE INDEX "VirtualAccount_customerIdentifier_idx" ON "VirtualAccount"("customerIdentifier");

-- AddForeignKey
ALTER TABLE "VirtualAccount" ADD CONSTRAINT "VirtualAccount_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
