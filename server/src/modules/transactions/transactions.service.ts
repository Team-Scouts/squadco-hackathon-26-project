import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { GraphService } from '../graph/graph.service';
import { RiskLevel } from '../../generated/prisma/enums';

type FinancialRiskSignal = {
  code: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  scoreImpact: number;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly graphService: GraphService,
  ) {}

  async create(createTransactionDto: CreateTransactionDto) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: createTransactionDto.vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        vendorId: createTransactionDto.vendorId,
        transactionRef: createTransactionDto.transactionRef,
        amount: createTransactionDto.amount,
        channel: createTransactionDto.channel ?? 'MANUAL',
        status: createTransactionDto.status ?? 'PENDING',
      },
    });

    const risk = await this.evaluateVendorFinancialRisk(vendor.id, {
      transactionRef: transaction.transactionRef,
    });
    const graphSynced = await this.graphService.safeSyncVendorById(vendor.id);

    return {
      success: true,
      message: 'Transaction created successfully',
      data: transaction,
      risk,
      graphSynced,
    };
  }

  async findAll() {
    const transactions = await this.prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: { vendor: true },
    });

    return {
      success: true,
      count: transactions.length,
      data: transactions,
    };
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        vendor: true,
        webhookEvents: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      success: true,
      data: transaction,
    };
  }

  async update(id: string, updateTransactionDto: UpdateTransactionDto) {
    const existing = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Transaction not found');
    }

    const transaction = await this.prisma.transaction.update({
      where: { id },
      data: {
        amount: updateTransactionDto.amount,
        channel: updateTransactionDto.channel,
        status: updateTransactionDto.status,
      },
    });

    const risk = await this.evaluateVendorFinancialRisk(transaction.vendorId, {
      transactionRef: transaction.transactionRef,
    });
    const graphSynced = await this.graphService.safeSyncVendorById(
      transaction.vendorId,
    );

    return {
      success: true,
      message: 'Transaction updated successfully',
      data: transaction,
      risk,
      graphSynced,
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Transaction not found');
    }

    await this.prisma.transaction.delete({ where: { id } });
    const risk = await this.evaluateVendorFinancialRisk(existing.vendorId);
    const graphSynced = await this.graphService.safeSyncVendorById(
      existing.vendorId,
    );

    return {
      success: true,
      message: 'Transaction deleted successfully',
      risk,
      graphSynced,
    };
  }

  async evaluateVendorFinancialRisk(
    vendorId: string,
    context: {
      transactionRef?: string | null;
      transferReference?: string | null;
      webhookEventId?: string | null;
    } = {},
  ) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        transactions: true,
        bankAccounts: true,
        transfers: {
          include: {
            bankAccount: true,
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const webhookFilters = [
      ...vendor.transactions.map((transaction) => ({
        transactionReference: transaction.transactionRef,
      })),
      ...vendor.transfers.map((transfer) => ({
        transferReference: transfer.transferReference,
      })),
    ];
    const webhookEvents = webhookFilters.length
      ? await this.prisma.webhookEvent.findMany({
          where: {
            OR: webhookFilters,
          },
          orderBy: { createdAt: 'desc' },
        })
      : [];
    const signals: FinancialRiskSignal[] = [];
    const failedStatuses = new Set(['FAILED', 'FAIL', 'DECLINED', 'REJECTED']);
    const failedTransactions = vendor.transactions.filter((transaction) =>
      failedStatuses.has(transaction.status.toUpperCase()),
    );

    if (failedTransactions.length >= 3) {
      signals.push({
        code: 'REPEATED_FAILED_PAYMENTS',
        message: 'Vendor has three or more failed payment attempts.',
        severity: 'HIGH',
        scoreImpact: 25,
        metadata: { failedCount: failedTransactions.length },
      });
    }

    const currentTransaction = context.transactionRef
      ? vendor.transactions.find(
          (transaction) => transaction.transactionRef === context.transactionRef,
        )
      : vendor.transactions[0];
    const previousAmounts = vendor.transactions
      .filter((transaction) => transaction.id !== currentTransaction?.id)
      .map((transaction) => transaction.amount)
      .filter((amount) => Number.isFinite(amount) && amount > 0);
    const averageAmount = previousAmounts.length
      ? previousAmounts.reduce((sum, amount) => sum + amount, 0) /
        previousAmounts.length
      : 0;

    if (
      currentTransaction &&
      currentTransaction.amount >= 1_000_000 &&
      (!averageAmount || currentTransaction.amount >= averageAmount * 3)
    ) {
      signals.push({
        code: 'UNUSUALLY_HIGH_AMOUNT',
        message: 'Transaction amount is unusually high for this vendor.',
        severity: 'HIGH',
        scoreImpact: 25,
        metadata: {
          transactionRef: currentTransaction.transactionRef,
          amount: currentTransaction.amount,
          averageAmount,
        },
      });
    }

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentTransactions = vendor.transactions.filter(
      (transaction) => transaction.createdAt >= fifteenMinutesAgo,
    );

    if (recentTransactions.length >= 5) {
      signals.push({
        code: 'RAPID_TRANSACTION_VELOCITY',
        message: 'Vendor has five or more transactions in the last 15 minutes.',
        severity: 'HIGH',
        scoreImpact: 20,
        metadata: { recentCount: recentTransactions.length },
      });
    }

    const replayedRefs = this.findReplayedReferences(webhookEvents);
    for (const reference of replayedRefs) {
      signals.push({
        code: 'WEBHOOK_REPLAY_OR_IDEMPOTENCY_CONFLICT',
        message: 'Multiple webhook events reference the same transaction or transfer.',
        severity: 'MEDIUM',
        scoreImpact: 15,
        metadata: { reference },
      });
    }

    const refundEvents = webhookEvents.filter((event) =>
      JSON.stringify(event.rawPayload).toLowerCase().includes('refund'),
    );

    if (refundEvents.length >= 3) {
      signals.push({
        code: 'MANY_REFUNDS',
        message: 'Vendor has multiple refund-related webhook events.',
        severity: 'MEDIUM',
        scoreImpact: 20,
        metadata: { refundEventCount: refundEvents.length },
      });
    }

    for (const account of vendor.bankAccounts) {
      const sharedCount = await this.prisma.bankAccount.count({
        where: {
          accountNumberHash: account.accountNumberHash,
          vendorId: { not: vendorId },
        },
      });

      if (sharedCount > 0) {
        signals.push({
          code: 'TRANSFER_TO_SHARED_BANK_ACCOUNT',
          message: 'Vendor bank account is shared with another vendor.',
          severity: 'HIGH',
          scoreImpact: 35,
          metadata: {
            bankAccountId: account.id,
            sharedVendorCount: sharedCount,
          },
        });
      }

      if (
        account.lookupStatus.toUpperCase() === 'FAILED' ||
        (account.identityMatchScore > 0 && account.identityMatchScore < 70)
      ) {
        signals.push({
          code: 'BANK_ACCOUNT_IDENTITY_MISMATCH',
          message: 'Bank account lookup or identity match is below threshold.',
          severity: 'HIGH',
          scoreImpact: 25,
          metadata: {
            bankAccountId: account.id,
            lookupStatus: account.lookupStatus,
            identityMatchScore: account.identityMatchScore,
          },
        });
      }
    }

    const financialAnomalyRisk = Math.min(
      100,
      signals.reduce((sum, signal) => sum + signal.scoreImpact, 0),
    );
    const latestRisk = await this.prisma.riskScore.findFirst({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
    });
    const documentRisk = latestRisk?.documentRisk ?? 0;
    const networkFraudRisk = latestRisk?.networkFraudRisk ?? 0;
    const deviceRisk = latestRisk?.deviceRisk ?? 0;
    const identityMismatchRisk = Math.max(
      latestRisk?.identityMismatchRisk ?? 0,
      signals.some((signal) => signal.code === 'BANK_ACCOUNT_IDENTITY_MISMATCH')
        ? 25
        : 0,
    );
    const manualReviewPenalty = latestRisk?.manualReviewPenalty ?? 0;
    const overallRisk = Math.max(
      documentRisk,
      networkFraudRisk,
      financialAnomalyRisk,
      deviceRisk,
      identityMismatchRisk,
      manualReviewPenalty,
    );
    const riskLevel = this.resolveRiskLevel(overallRisk);
    const recommendedAction = this.resolveRecommendedAction(riskLevel);
    const riskScore = await this.prisma.riskScore.create({
      data: {
        vendorId,
        documentRisk,
        networkFraudRisk,
        financialAnomalyRisk,
        deviceRisk,
        identityMismatchRisk,
        manualReviewPenalty,
        overallRisk,
        riskLevel,
        recommendedAction,
        reasons: signals as any,
      },
    });

    if (context.transactionRef) {
      await this.prisma.transaction.updateMany({
        where: {
          vendorId,
          transactionRef: context.transactionRef,
        },
        data: {
          financialRiskScore: financialAnomalyRisk,
        },
      });
    }

    await this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        overallRiskScore: overallRisk,
        riskLevel,
      },
    });

    return {
      success: true,
      vendorId,
      financialAnomalyRisk,
      overallRisk,
      riskLevel,
      recommendedAction,
      signals,
      riskScore,
    };
  }

  private findReplayedReferences(webhookEvents: Array<{
    transactionReference: string | null;
    transferReference: string | null;
  }>) {
    const counts = new Map<string, number>();

    for (const event of webhookEvents) {
      const reference = event.transactionReference ?? event.transferReference;

      if (!reference) {
        continue;
      }

      counts.set(reference, (counts.get(reference) ?? 0) + 1);
    }

    return [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([reference]) => reference);
  }

  private resolveRiskLevel(score: number) {
    if (score >= 85) {
      return RiskLevel.CRITICAL;
    }

    if (score >= 60) {
      return RiskLevel.HIGH;
    }

    if (score >= 30) {
      return RiskLevel.MEDIUM;
    }

    return RiskLevel.LOW;
  }

  private resolveRecommendedAction(riskLevel: RiskLevel) {
    if (riskLevel === RiskLevel.CRITICAL) {
      return 'REJECT_AND_ESCALATE';
    }

    if (riskLevel === RiskLevel.HIGH) {
      return 'REQUIRE_MANUAL_REVIEW';
    }

    if (riskLevel === RiskLevel.MEDIUM) {
      return 'REVIEW_BEFORE_APPROVAL';
    }

    return 'APPROVE_IF_OTHER_CHECKS_PASS';
  }
}
