import 'dotenv/config';

import {
  DocumentVerificationStatus,
  OcrStatus,
  PrismaClient,
  RiskLevel,
  VendorStatus,
} from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const demoVendors = [
  {
    key: 'clean',
    businessName: 'Northline Export Ltd',
    registrationNumber: 'RC748922',
    vendorType: 'Supplier',
    sector: 'Export logistics',
    contactName: 'Ada Okafor',
    email: 'demo.clean@fraudlens.test',
    phone: '08010000001',
    country: 'Nigeria',
    state: 'Lagos',
    address: '14 Marina Road, Lagos Island, Lagos',
    status: VendorStatus.VERIFIED,
    riskLevel: RiskLevel.LOW,
    overallRiskScore: 12,
  },
  {
    key: 'cac-mismatch',
    businessName: 'Reddish Blue Fruit Company',
    registrationNumber: 'RC1234567',
    vendorType: 'Supplier',
    sector: 'Agriculture',
    contactName: 'Musa Bello',
    email: 'demo.cac-mismatch@fraudlens.test',
    phone: '08010000002',
    country: 'Nigeria',
    state: 'Oyo',
    address: '8 Ring Road, Ibadan, Oyo',
    status: VendorStatus.REVIEW,
    riskLevel: RiskLevel.HIGH,
    overallRiskScore: 70,
  },
  {
    key: 'duplicate-document',
    businessName: 'Koro Market Services Ltd',
    registrationNumber: 'RC555901',
    vendorType: 'Contractor',
    sector: 'Retail operations',
    contactName: 'Kemi Adeyemi',
    email: 'demo.duplicate-doc@fraudlens.test',
    phone: '08010000003',
    country: 'Nigeria',
    state: 'Lagos',
    address: '22 Allen Avenue, Ikeja, Lagos',
    status: VendorStatus.REVIEW,
    riskLevel: RiskLevel.HIGH,
    overallRiskScore: 65,
  },
  {
    key: 'shared-device',
    businessName: 'QuickCash Ventures',
    registrationNumber: 'BN880045',
    vendorType: 'Service Provider',
    sector: 'Payments',
    contactName: 'Tunde Salami',
    email: 'demo.shared-device@fraudlens.test',
    phone: '08010000004',
    country: 'Nigeria',
    state: 'Abuja',
    address: '5 Adetokunbo Ademola Crescent, Wuse, Abuja',
    status: VendorStatus.REVIEW,
    riskLevel: RiskLevel.CRITICAL,
    overallRiskScore: 90,
  },
  {
    key: 'financial-risk',
    businessName: 'Apex Build Group',
    registrationNumber: 'RC909888',
    vendorType: 'Contractor',
    sector: 'Construction',
    contactName: 'Chinedu Obi',
    email: 'demo.financial-risk@fraudlens.test',
    phone: '08010000005',
    country: 'Nigeria',
    state: 'Rivers',
    address: '19 Aba Road, Port Harcourt, Rivers',
    status: VendorStatus.PENDING,
    riskLevel: RiskLevel.HIGH,
    overallRiskScore: 72,
  },
] as const;

const duplicateHash = 'seed_doc_hash_duplicate_cac_001';
const sharedDeviceHash = 'seed_device_shared_browser_001';
const sharedAccountHash = 'seed_bank_hash_shared_001';

async function main() {
  console.log('Starting FraudLens MVP seed...');

  const vendors = new Map<string, Awaited<ReturnType<typeof upsertVendor>>>();

  for (const vendorData of demoVendors) {
    const vendor = await upsertVendor(vendorData);
    vendors.set(vendorData.key, vendor);
  }

  await seedCleanVendor(vendors.get('clean')!);
  await seedCacMismatchVendor(vendors.get('cac-mismatch')!);
  await seedDuplicateDocumentVendor(vendors.get('duplicate-document')!);
  await seedSharedDeviceVendor(vendors.get('shared-device')!, vendors.get('duplicate-document')!);
  await seedFinancialRiskVendor(vendors.get('financial-risk')!);

  console.log('Seed completed. Run POST /graph/sync after starting the API to rebuild Neo4j from PostgreSQL.');
}

async function upsertVendor(vendorData: (typeof demoVendors)[number]) {
  const { key, ...vendorFields } = vendorData;
  const existing = await prisma.vendor.findUnique({
    where: { email: vendorData.email },
  });

  if (existing) {
    await resetVendorEvidence(existing.id);
  }

  return prisma.vendor.upsert({
    where: { email: vendorData.email },
    update: vendorFields,
    create: vendorFields,
  });
}

async function resetVendorEvidence(vendorId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { vendorId },
    select: { transactionRef: true },
  });
  const transfers = await prisma.transfer.findMany({
    where: { vendorId },
    select: { transferReference: true },
  });

  await prisma.webhookEvent.deleteMany({
    where: {
      OR: [
        { transactionReference: { in: transactions.map((item) => item.transactionRef) } },
        { transferReference: { in: transfers.map((item) => item.transferReference) } },
      ],
    },
  });
  await prisma.transfer.deleteMany({ where: { vendorId } });
  await prisma.transaction.deleteMany({ where: { vendorId } });
  await prisma.virtualAccount.deleteMany({ where: { vendorId } });
  await prisma.bankAccount.deleteMany({ where: { vendorId } });
  await prisma.device.deleteMany({ where: { vendorId } });
  await prisma.document.deleteMany({ where: { vendorId } });
  await prisma.alert.deleteMany({ where: { vendorId } });
  await prisma.riskScore.deleteMany({ where: { vendorId } });
}

async function seedCleanVendor(vendor: { id: string; businessName: string }) {
  await createDevice(vendor.id, 'seed_device_clean_001', 0);
  await createBankAndTransfer(vendor.id, vendor.businessName, 'seed_bank_hash_clean_001', '1001', 'TRF_SEED_CLEAN', 'SUCCESS', 250000, 96);
  await createTransaction(vendor.id, 'TXN_SEED_CLEAN_001', 45000, 'virtual-account', 'SUCCESS', 0);
  await createDocumentSet(vendor.id, {
    cacHash: 'seed_doc_hash_clean_cac',
    status: DocumentVerificationStatus.VERIFIED,
    tamperScore: 5,
  });
  await createRisk(vendor.id, {
    documentRisk: 5,
    deviceRisk: 0,
    financialAnomalyRisk: 0,
    overallRisk: 12,
    riskLevel: RiskLevel.LOW,
    reasons: [{ code: 'SEED_CLEAN_PROFILE', message: 'Clean seeded profile.', severity: 'LOW', scoreImpact: 0 }],
  });
}

async function seedCacMismatchVendor(vendor: { id: string }) {
  await createDevice(vendor.id, 'seed_device_cac_mismatch_001', 0);
  await createDocument(vendor.id, 'CAC_REGISTRATION', 'seed_doc_hash_cac_mismatch', 50, DocumentVerificationStatus.NEEDS_REVIEW, [
    { label: 'Legal business name', extracted: 'Northline Export Ltd', verified: 'Reddish Blue Fruit Company', confidence: 98, status: 'flagged' },
    { label: 'Registration number', extracted: 'RC748922', verified: 'RC1234567', confidence: 98, status: 'flagged' },
  ], [
    { code: 'BUSINESS_NAME_MISMATCH', message: 'Extracted business name differs from vendor profile.', severity: 'HIGH', scoreImpact: 25 },
    { code: 'REGISTRATION_NUMBER_MISMATCH', message: 'Extracted registration number differs from vendor profile.', severity: 'HIGH', scoreImpact: 25 },
  ]);
  await createRisk(vendor.id, {
    documentRisk: 60,
    identityMismatchRisk: 25,
    overallRisk: 70,
    riskLevel: RiskLevel.HIGH,
    reasons: [{ code: 'SEED_CAC_MISMATCH', message: 'CAC profile values conflict with OCR fields.', severity: 'HIGH', scoreImpact: 50 }],
  });
}

async function seedDuplicateDocumentVendor(vendor: { id: string; businessName: string }) {
  await createDevice(vendor.id, sharedDeviceHash, 70);
  await createBankAndTransfer(vendor.id, vendor.businessName, sharedAccountHash, '2020', 'TRF_SEED_SHARED_A', 'PENDING', 90000, 58);
  await createDocument(vendor.id, 'CAC_REGISTRATION', duplicateHash, 45, DocumentVerificationStatus.NEEDS_REVIEW, [], [
    { code: 'DUPLICATE_DOCUMENT', message: 'This document hash is linked to another vendor.', severity: 'HIGH', scoreImpact: 45 },
  ]);
  await createDocument(vendor.id, 'TAX_ID', 'seed_doc_hash_tax_missing_name', 20, DocumentVerificationStatus.NEEDS_REVIEW, [
    { label: 'Tax identification number', extracted: '1234567890', verified: '', confidence: 88, status: 'match' },
    { label: 'Legal business name', extracted: '', verified: vendor.businessName, confidence: 0, status: 'missing' },
  ], [
    { code: 'MISSING_EXPECTED_FIELD', message: 'Business name missing on tax document.', severity: 'MEDIUM', scoreImpact: 10 },
  ]);
  await createRisk(vendor.id, {
    documentRisk: 55,
    deviceRisk: 70,
    networkFraudRisk: 45,
    overallRisk: 70,
    riskLevel: RiskLevel.HIGH,
    reasons: [{ code: 'SEED_DUPLICATE_CLUSTER', message: 'Duplicate document and shared device signals.', severity: 'HIGH', scoreImpact: 70 }],
  });
}

async function seedSharedDeviceVendor(
  vendor: { id: string; businessName: string },
  duplicateVendor: { id: string },
) {
  await createDevice(vendor.id, sharedDeviceHash, 70);
  await createBankAndTransfer(vendor.id, vendor.businessName, sharedAccountHash, '2020', 'TRF_SEED_SHARED_B', 'FAILED', 50000, 45);
  await createDocument(vendor.id, 'CAC_REGISTRATION', duplicateHash, 45, DocumentVerificationStatus.NEEDS_REVIEW, [], [
    { code: 'DUPLICATE_DOCUMENT', message: 'This document hash is linked to another vendor.', severity: 'HIGH', scoreImpact: 45, metadata: { duplicateVendorId: duplicateVendor.id } },
  ]);
  await createRisk(vendor.id, {
    documentRisk: 55,
    networkFraudRisk: 88,
    deviceRisk: 70,
    financialAnomalyRisk: 35,
    identityMismatchRisk: 25,
    overallRisk: 90,
    riskLevel: RiskLevel.CRITICAL,
    reasons: [{ code: 'SEED_FRAUD_CLUSTER', message: 'Seeded multi-signal fraud cluster.', severity: 'CRITICAL', scoreImpact: 90 }],
  });
}

async function seedFinancialRiskVendor(vendor: { id: string; businessName: string }) {
  await createDevice(vendor.id, 'seed_device_financial_001', 0);
  await createBankAndTransfer(vendor.id, vendor.businessName, 'seed_bank_hash_financial_001', '7788', 'TRF_SEED_FINANCIAL', 'SUCCESS', 1200000, 92);
  await createTransaction(vendor.id, 'TXN_SEED_FAIL_001', 15000, 'card', 'FAILED', 25);
  await createTransaction(vendor.id, 'TXN_SEED_FAIL_002', 17500, 'card', 'FAILED', 25);
  await createTransaction(vendor.id, 'TXN_SEED_FAIL_003', 21000, 'card', 'FAILED', 25);
  await createTransaction(vendor.id, 'TXN_SEED_HIGH_001', 2500000, 'virtual-account', 'SUCCESS', 72);
  await createWebhook(vendor.id, 'transaction.failed', 'TXN_SEED_FAIL_001');
  await createWebhook(vendor.id, 'transaction.replay', 'TXN_SEED_FAIL_001');
  await createDocument(vendor.id, 'CAC_REGISTRATION', 'seed_doc_hash_synthetic', 75, DocumentVerificationStatus.NEEDS_REVIEW, [], [
    { code: 'SUSPECTED_AI_GENERATED_DOCUMENT', message: 'Synthetic document risk is elevated.', severity: 'HIGH', scoreImpact: 30 },
  ], 82, true);
  await createRisk(vendor.id, {
    documentRisk: 75,
    financialAnomalyRisk: 72,
    overallRisk: 75,
    riskLevel: RiskLevel.HIGH,
    reasons: [{ code: 'SEED_FINANCIAL_ANOMALY', message: 'Repeated failures, replay, and high-value transaction.', severity: 'HIGH', scoreImpact: 72 }],
  });
}

async function createDocumentSet(
  vendorId: string,
  input: {
    cacHash: string;
    status: DocumentVerificationStatus;
    tamperScore: number;
  },
) {
  await createDocument(vendorId, 'CAC_REGISTRATION', input.cacHash, input.tamperScore, input.status);
  await createDocument(vendorId, 'TAX_ID', `${input.cacHash}_tax`, 4, input.status);
  await createDocument(vendorId, 'OWNER_ID', `${input.cacHash}_owner`, 3, input.status);
  await createDocument(vendorId, 'ADDRESS_PROOF', `${input.cacHash}_address`, 5, input.status);
}

async function createDocument(
  vendorId: string,
  documentType: string,
  documentHash: string,
  tamperScore: number,
  verificationStatus: DocumentVerificationStatus,
  extractedFields: unknown[] = [],
  verificationReasons: unknown[] = [],
  aiGeneratedScore = 0,
  aiGeneratedDetected = false,
) {
  return prisma.document.create({
    data: {
      vendorId,
      documentType,
      fileUrl: `https://example.com/fraudlens-seed/${documentHash}.pdf`,
      documentHash,
      tamperScore,
      verificationStatus,
      duplicateDetected: documentHash === duplicateHash,
      duplicateVendorCount: documentHash === duplicateHash ? 1 : 0,
      extractedFields: extractedFields as any,
      verificationReasons: verificationReasons as any,
      ocrProvider: 'seed',
      ocrStatus: OcrStatus.COMPLETED,
      ocrText: `Seed OCR text for ${documentType}`,
      ocrConfidence: 92,
      aiGeneratedScore,
      aiGeneratedDetected,
      forensicSignals: aiGeneratedDetected
        ? [{ code: 'SEED_SYNTHETIC_DOCUMENT', message: 'Seeded synthetic risk.', weight: 30 }]
        : [],
      processedAt: new Date(),
    },
  });
}

async function createDevice(vendorId: string, deviceHash: string, riskScore: number) {
  return prisma.device.create({
    data: {
      vendorId,
      deviceHash,
      ipAddress: riskScore >= 70 ? '102.88.12.44' : '102.88.10.10',
      browser: 'Chrome / FingerprintJS Seed',
      timezone: 'Africa/Lagos',
      riskScore,
    },
  });
}

async function createTransaction(
  vendorId: string,
  transactionRef: string,
  amount: number,
  channel: string,
  status: string,
  financialRiskScore: number,
) {
  return prisma.transaction.create({
    data: {
      vendorId,
      transactionRef,
      amount,
      channel,
      status,
      financialRiskScore,
    },
  });
}

async function createBankAndTransfer(
  vendorId: string,
  accountName: string,
  accountNumberHash: string,
  accountNumberLast4: string,
  transferReference: string,
  status: string,
  amount: number,
  identityMatchScore: number,
) {
  const bankAccount = await prisma.bankAccount.create({
    data: {
      vendorId,
      bankCode: '058',
      bankName: 'Guaranty Trust Bank',
      accountNumberHash,
      accountNumberLast4,
      accountName,
      lookupStatus: identityMatchScore >= 70 ? 'MATCHED' : 'REVIEW',
      identityMatchScore,
    },
  });

  await prisma.transfer.create({
    data: {
      vendorId,
      bankAccountId: bankAccount.id,
      transferReference,
      amount,
      currency: 'NGN',
      status,
      rawPayload: { seed: true, transferReference },
    },
  });

  return bankAccount;
}

async function createWebhook(
  vendorId: string,
  eventType: string,
  transactionReference: string,
) {
  return prisma.webhookEvent.create({
    data: {
      provider: 'squad',
      eventType,
      transactionReference,
      rawPayload: {
        seed: true,
        data: {
          metadata: { vendorId },
          transaction_reference: transactionReference,
        },
      },
      signature: 'seed-signature',
      processed: true,
      processedAt: new Date(),
    },
  });
}

async function createRisk(
  vendorId: string,
  input: {
    documentRisk?: number;
    networkFraudRisk?: number;
    financialAnomalyRisk?: number;
    deviceRisk?: number;
    identityMismatchRisk?: number;
    manualReviewPenalty?: number;
    overallRisk: number;
    riskLevel: RiskLevel;
    reasons: unknown[];
  },
) {
  await prisma.riskScore.create({
    data: {
      vendorId,
      documentRisk: input.documentRisk ?? 0,
      networkFraudRisk: input.networkFraudRisk ?? 0,
      financialAnomalyRisk: input.financialAnomalyRisk ?? 0,
      deviceRisk: input.deviceRisk ?? 0,
      identityMismatchRisk: input.identityMismatchRisk ?? 0,
      manualReviewPenalty: input.manualReviewPenalty ?? 0,
      overallRisk: input.overallRisk,
      riskLevel: input.riskLevel,
      recommendedAction:
        input.riskLevel === RiskLevel.LOW
          ? 'APPROVE_IF_OTHER_CHECKS_PASS'
          : input.riskLevel === RiskLevel.MEDIUM
            ? 'REVIEW_BEFORE_APPROVAL'
            : input.riskLevel === RiskLevel.HIGH
              ? 'REQUIRE_MANUAL_REVIEW'
              : 'REJECT_AND_ESCALATE',
      reasons: input.reasons as any,
    },
  });

  await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      overallRiskScore: input.overallRisk,
      riskLevel: input.riskLevel,
    },
  });
}

main()
  .catch((error) => {
    console.error('Seed failed');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
