import 'dotenv/config';

import {
  AlertType,
  PrismaClient,
  RiskLevel,
  VendorStatus,
} from '../src/generated/prisma/client';

import { devices } from './mock/devices';
import { transactions } from './mock/transactions';
import { alerts } from './mock/alerts';
import { vendors } from './mock/ventors';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  for (let i = 0; i < vendors.length; i++) {
    const vendorData = vendors[i];

    // Create Vendor
    const vendor = await prisma.vendor.create({
      data: {
        businessName: vendorData.businessName,
        email: vendorData.email,
        phone: vendorData.phone,
        overallRiskScore: vendorData.overallRiskScore,
        riskLevel: vendorData.riskLevel as RiskLevel,
        status: vendorData.status as VendorStatus,
      },
    });

    // Create Device
    const device = devices[i % devices.length];

    await prisma.device.create({
      data: {
        vendorId: vendor.id,
        deviceHash: device.deviceHash,
        ipAddress: device.ipAddress,
        browser: device.browser,
        timezone: device.timezone,
        riskScore: device.riskScore,
      },
    });

    // Create Transaction
    const transaction = transactions[i % transactions.length];

    await prisma.transaction.create({
      data: {
        vendorId: vendor.id,
        transactionRef: `${transaction.transactionRef}_${i}`,
        amount: transaction.amount,
        channel: transaction.channel,
        status: transaction.status,
        financialRiskScore: transaction.financialRiskScore,
      },
    });

    // Create Alert
    const alert = alerts[i % alerts.length];

    await prisma.alert.create({
      data: {
        vendorId: vendor.id,
        type: alert.type as AlertType,
        message: alert.message,
      },
    });

    const accountHash = i === 0 ? 'acct_hash_clean_001' : 'acct_hash_shared_001';
    const bankAccount = await prisma.bankAccount.create({
      data: {
        vendorId: vendor.id,
        bankCode: '058',
        bankName: 'Guaranty Trust Bank',
        accountNumberHash: accountHash,
        accountNumberLast4: i === 0 ? '1001' : '2020',
        accountName: vendorData.businessName,
        lookupStatus: 'MATCHED',
        identityMatchScore: i === 0 ? 96 : 58,
      },
    });

    await prisma.transfer.create({
      data: {
        vendorId: vendor.id,
        bankAccountId: bankAccount.id,
        transferReference: `TRF_${String(i + 1).padStart(3, '0')}`,
        amount: i === 0 ? 250000 : 50000,
        currency: 'NGN',
        status: i === 0 ? 'SUCCESS' : 'PENDING',
        rawPayload: {
          sandbox: true,
          seeded: true,
        },
      },
    });

    await prisma.riskScore.create({
      data: {
        vendorId: vendor.id,
        documentRisk: i === 0 ? 8 : 62,
        networkFraudRisk: i === 0 ? 5 : 88,
        financialAnomalyRisk: i === 0 ? 12 : 70,
        deviceRisk: i === 0 ? 10 : 90,
        identityMismatchRisk: i === 0 ? 4 : 55,
        manualReviewPenalty: i === 0 ? 0 : 20,
        overallRisk: vendorData.overallRiskScore,
        riskLevel: vendorData.riskLevel as RiskLevel,
        recommendedAction: i === 0 ? 'approve' : 'manual_review',
        reasons:
          i === 0
            ? ['Clean document hash', 'Unique payment and account signals']
            : ['Shared device signal', 'Shared bank account hash'],
      },
    });

    // Create Document
    await prisma.document.create({
      data: {
        vendorId: vendor.id,
        documentType: 'CAC_CERTIFICATE',
        fileUrl: 'https://example.com/cac-doc.pdf',
        documentHash: i === 0 ? 'DOC_HASH_CLEAN_001' : 'DOC_HASH_SHARED_001',
        tamperScore: Math.random() * 100,
      },
    });
  }

  console.log('✅ Seed completed successfully');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed');
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
