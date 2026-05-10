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

    // Create Document
    await prisma.document.create({
      data: {
        vendorId: vendor.id,
        documentType: 'CAC_CERTIFICATE',
        fileUrl: 'https://example.com/cac-doc.pdf',
        documentHash: `DOC_HASH_${i}`,
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
