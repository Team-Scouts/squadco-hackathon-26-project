import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentVerificationStatus, RiskLevel } from '../../generated/prisma/enums';
import { CreateRiskDto } from './dto/create-risk.dto';
import { UpdateRiskDto } from './dto/update-risk.dto';

export type RiskSignal = {
  code: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  scoreImpact: number;
  metadata?: Record<string, unknown>;
};

export type RiskRecomputeInput = {
  documentRisk?: number;
  networkFraudRisk?: number;
  financialAnomalyRisk?: number;
  deviceRisk?: number;
  identityMismatchRisk?: number;
  manualReviewPenalty?: number;
  reasons?: RiskSignal[];
};

const REQUIRED_DOCUMENT_TYPES = [
  'CAC_REGISTRATION',
  'TAX_ID',
  'OWNER_ID',
  'ADDRESS_PROOF',
] as const;

@Injectable()
export class RiskService {
  constructor(private readonly prisma: PrismaService) {}

  async recomputeVendorRisk(vendorId: string, input: RiskRecomputeInput = {}) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        documents: true,
        devices: true,
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

    const latestRisk = await this.prisma.riskScore.findFirst({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
    });
    const documentEvaluation = this.evaluateDocumentComponent(
      vendor.documents,
      input.documentRisk,
    );
    const deviceRisk =
      input.deviceRisk ?? Math.max(0, ...vendor.devices.map((device) => device.riskScore));
    const financialAnomalyRisk =
      input.financialAnomalyRisk ??
      Math.max(
        latestRisk?.financialAnomalyRisk ?? 0,
        ...vendor.transactions.map((transaction) => transaction.financialRiskScore),
      );
    const identityMismatchRisk = Math.max(
      input.identityMismatchRisk ?? 0,
      latestRisk?.identityMismatchRisk ?? 0,
      documentEvaluation.identityMismatchRisk,
    );
    const manualReviewPenalty = Math.max(
      input.manualReviewPenalty ?? 0,
      latestRisk?.manualReviewPenalty ?? 0,
      documentEvaluation.manualReviewPenalty,
    );
    const networkFraudRisk =
      input.networkFraudRisk ?? latestRisk?.networkFraudRisk ?? 0;
    const documentRisk = documentEvaluation.documentRisk;
    const reasons = [
      ...documentEvaluation.reasons,
      ...(Array.isArray(latestRisk?.reasons)
        ? (latestRisk?.reasons as RiskSignal[])
        : []),
      ...(input.reasons ?? []),
    ];
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
        reasons: this.dedupeReasons(reasons) as any,
      },
    });

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
      documentRisk,
      networkFraudRisk,
      financialAnomalyRisk,
      deviceRisk,
      identityMismatchRisk,
      manualReviewPenalty,
      overallRisk,
      riskLevel,
      recommendedAction,
      reasons: this.dedupeReasons(reasons),
      riskScore,
    };
  }

  create(createRiskDto: CreateRiskDto) {
    return 'Risk scoring is computed from vendor evidence. Use vendor/document check endpoints.';
  }

  findAll() {
    return this.prisma.riskScore.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  findOne(id: number) {
    return `Risk lookup by numeric id is not supported.`;
  }

  update(id: number, updateRiskDto: UpdateRiskDto) {
    return `Risk scores are immutable snapshots.`;
  }

  remove(id: number) {
    return `Risk scores are immutable snapshots.`;
  }

  private evaluateDocumentComponent(
    documents: Array<{
      documentType: string;
      tamperScore: number;
      verificationStatus: DocumentVerificationStatus;
      verificationReasons: unknown;
    }>,
    override?: number,
  ) {
    const uploadedTypes = new Set(documents.map((document) => document.documentType));
    const missingTypes = REQUIRED_DOCUMENT_TYPES.filter(
      (documentType) => !uploadedTypes.has(documentType),
    );
    const missingRequiredRisk = Math.min(30, missingTypes.length * 10);
    const maxDocumentTamper = Math.max(
      0,
      ...documents.map((document) => Number(document.tamperScore ?? 0)),
      override ?? 0,
    );
    const rejectedDocumentRisk = documents.some(
      (document) => document.verificationStatus === DocumentVerificationStatus.REJECTED,
    )
      ? 60
      : 0;
    const reasons: RiskSignal[] = missingTypes.length
      ? [
          {
            code: 'MISSING_REQUIRED_KYC_DOCUMENTS',
            message: 'One or more required KYC documents have not been uploaded.',
            severity: missingRequiredRisk >= 30 ? 'MEDIUM' : 'LOW',
            scoreImpact: missingRequiredRisk,
            metadata: {
              missingDocumentTypes: missingTypes,
            },
          },
        ]
      : [];
    const documentReasons = documents.flatMap((document) =>
      Array.isArray(document.verificationReasons)
        ? (document.verificationReasons as RiskSignal[])
        : [],
    );
    const identityMismatchRisk = documentReasons.some((reason) =>
      [
        'BUSINESS_NAME_MISMATCH',
        'REGISTRATION_NUMBER_MISMATCH',
        'PROFILE_FIELD_MISMATCH',
      ].includes(reason.code),
    )
      ? 25
      : 0;
    const manualReviewPenalty =
      rejectedDocumentRisk ||
      (documentReasons.some((reason) => reason.code.startsWith('MANUAL_'))
        ? 60
        : 0);

    return {
      documentRisk: Math.min(
        100,
        Math.max(maxDocumentTamper, rejectedDocumentRisk) + missingRequiredRisk,
      ),
      identityMismatchRisk,
      manualReviewPenalty,
      reasons: [...reasons, ...documentReasons],
    };
  }

  private dedupeReasons(reasons: RiskSignal[]) {
    const seen = new Set<string>();

    return reasons.filter((reason) => {
      const key = `${reason.code}:${JSON.stringify(reason.metadata ?? {})}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
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
