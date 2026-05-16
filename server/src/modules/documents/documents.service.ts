import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UploadDocumentDto } from './dto/upload-document.dto';

import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { GraphService } from '../graph/graph.service';
import { UpdateDocumentVerificationDto } from './dto/update-document-verification.dto';
import {
  DocumentVerificationStatus,
  OcrStatus,
  RiskLevel,
} from '../../generated/prisma/enums';
import {
  DocumentIntelligenceResult,
  DocumentIntelligenceService,
  VerificationReason,
} from './document-intelligence.service';
import { RiskService } from '../risk/risk.service';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private graphService: GraphService,
    private documentIntelligenceService: DocumentIntelligenceService,
    private riskService: RiskService,
  ) {}

  async uploadDocument(
    file: Express.Multer.File,
    uploadDocumentDto: UploadDocumentDto,
  ) {
    if (!file) {
      throw new BadRequestException('Document file is required');
    }

    const vendor = await this.prisma.vendor.findUnique({
      where: {
        id: uploadDocumentDto.vendorId,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const uploadedFile: any = await this.cloudinaryService.uploadFile(file);

    const documentHash = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    const document = await this.prisma.document.create({
      data: {
        vendorId: uploadDocumentDto.vendorId,
        documentType: uploadDocumentDto.documentType,
        fileUrl: uploadedFile.secure_url,
        documentHash,
        verificationStatus: DocumentVerificationStatus.PENDING,
        ocrStatus: OcrStatus.PENDING,
      },
    });

    const { document: checkedDocument, duplicateSummary } =
      await this.applyDuplicateChecks(document.id);
    const graphSynced = await this.graphService.safeSyncVendorById(vendor.id);
    this.runChecks(checkedDocument.id).catch(() => undefined);

    return {
      success: true,
      message: 'Document uploaded successfully',
      data: checkedDocument,
      duplicateSummary,
      graphSynced,
    };
  }

  async getVendorDocuments(vendorId: string) {
    const documents = await this.prisma.document.findMany({
      where: {
        vendorId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      count: documents.length,
      data: documents,
    };
  }

  async getDocumentById(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        vendor: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return {
      success: true,
      data: document,
    };
  }

  async updateVerification(
    id: string,
    updateDocumentVerificationDto: UpdateDocumentVerificationDto,
  ) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const verifiedAt =
      updateDocumentVerificationDto.verificationStatus ===
      DocumentVerificationStatus.VERIFIED
        ? new Date()
        : null;

    const updatedDocument = await this.prisma.document.update({
      where: { id },
      data: {
        verificationStatus: updateDocumentVerificationDto.verificationStatus,
        extractedFields:
          updateDocumentVerificationDto.extractedFields ??
          (document.extractedFields as any),
        reviewNotes:
          updateDocumentVerificationDto.reviewNotes ?? document.reviewNotes,
        verifiedAt,
      },
    });
    await this.updateDocumentRisk(updatedDocument.vendorId, {
      documentRisk:
        updateDocumentVerificationDto.verificationStatus ===
        DocumentVerificationStatus.REJECTED
          ? 60
          : updatedDocument.tamperScore,
      reasons: [
        ...(Array.isArray(updatedDocument.verificationReasons)
          ? (updatedDocument.verificationReasons as VerificationReason[])
          : []),
        ...(updateDocumentVerificationDto.verificationStatus ===
        DocumentVerificationStatus.REJECTED
          ? [
              {
                code: 'MANUAL_DOCUMENT_REJECTION',
                message: 'Reviewer rejected the document.',
                severity: 'HIGH',
                scoreImpact: 60,
              } satisfies VerificationReason,
            ]
          : []),
      ],
    });

    const graphSynced = await this.graphService.safeSyncVendorById(
      updatedDocument.vendorId,
    );

    return {
      success: true,
      message: 'Document verification updated successfully',
      data: updatedDocument,
      graphSynced,
    };
  }

  async runChecks(id: string) {
    const { document, duplicateSummary } = await this.applyDuplicateChecks(id);
    const documentWithVendor = await this.prisma.document.findUnique({
      where: { id: document.id },
      include: {
        vendor: true,
      },
    });

    if (!documentWithVendor) {
      throw new NotFoundException('Document not found');
    }

    if (documentWithVendor.ocrProvider === 'seed') {
      await this.updateDocumentRisk(documentWithVendor.vendorId, {
        documentRisk: documentWithVendor.tamperScore,
        reasons: Array.isArray(documentWithVendor.verificationReasons)
          ? (documentWithVendor.verificationReasons as VerificationReason[])
          : [],
      });
      const graphSynced = await this.graphService.safeSyncVendorById(
        documentWithVendor.vendorId,
      );

      return {
        success: true,
        message: 'Seed document checks refreshed',
        data: documentWithVendor,
        duplicateSummary,
        intelligence: null,
        graphSynced,
      };
    }

    await this.prisma.document.update({
      where: { id: document.id },
      data: {
        ocrStatus: OcrStatus.PROCESSING,
        processingError: null,
      },
    });

    let processedDocument = document;
    let intelligence: DocumentIntelligenceResult | null = null;

    try {
      intelligence = await this.documentIntelligenceService.analyzeDocument({
        document: documentWithVendor,
        vendor: documentWithVendor.vendor,
      });

      const verificationStatus = this.resolveVerificationStatusAfterIntelligence(
        document.verificationStatus,
        intelligence,
      );

      processedDocument = await this.prisma.document.update({
        where: { id: document.id },
        data: {
          ocrProvider: intelligence.ocrProvider,
          ocrStatus: OcrStatus.COMPLETED,
          ocrText: intelligence.ocrText,
          ocrConfidence: intelligence.ocrConfidence,
          extractedFields: intelligence.extractedFields,
          aiGeneratedScore: intelligence.aiGeneratedScore,
          aiGeneratedDetected: intelligence.aiGeneratedDetected,
          forensicSignals: intelligence.forensicSignals,
          tamperScore: intelligence.tamperScore,
          verificationReasons: intelligence.reasons as any,
          verificationStatus,
          processedAt: new Date(),
          processingError: null,
        },
      });

      await this.updateDocumentRisk(processedDocument.vendorId, {
        documentRisk: intelligence.tamperScore,
        reasons: intelligence.reasons,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      processedDocument = await this.prisma.document.update({
        where: { id: document.id },
        data: {
          ocrStatus: OcrStatus.FAILED,
          processingError: message,
          verificationStatus: DocumentVerificationStatus.NEEDS_REVIEW,
          verificationReasons: [
            ...(Array.isArray(document.verificationReasons)
              ? (document.verificationReasons as VerificationReason[])
              : []),
            {
              code: 'DOCUMENT_INTELLIGENCE_FAILED',
              message:
                'Automated document intelligence failed and requires reviewer confirmation.',
              severity: 'MEDIUM',
              scoreImpact: 10,
              metadata: {
                error: message,
              },
            },
          ] as any,
        },
      });
    }

    const graphSynced = await this.graphService.safeSyncVendorById(
      processedDocument.vendorId,
    );

    return {
      success: true,
      message: 'Document checks completed',
      data: processedDocument,
      duplicateSummary,
      intelligence,
      graphSynced,
    };
  }

  async runVendorChecks(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const documents = await this.prisma.document.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'asc' },
    });
    const results: any[] = [];

    for (const document of documents) {
      try {
        results.push(await this.runChecks(document.id));
      } catch (error) {
        results.push({
          success: false,
          documentId: document.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const risk = await this.riskService.recomputeVendorRisk(vendorId);
    const graphSynced = await this.graphService.safeSyncVendorById(vendorId);

    return {
      success: true,
      message: 'Vendor document checks completed',
      count: results.length,
      data: results,
      risk,
      graphSynced,
    };
  }

  private async applyDuplicateChecks(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const duplicateVendors = document.documentHash
      ? await this.prisma.document.findMany({
          where: {
            documentHash: document.documentHash,
            id: {
              not: document.id,
            },
            vendorId: {
              not: document.vendorId,
            },
          },
          distinct: ['vendorId'],
          select: {
            vendorId: true,
          },
        })
      : [];

    const duplicateVendorCount = duplicateVendors.length;
    const duplicateDetected = duplicateVendorCount > 0;
    const verificationReasons = duplicateDetected
      ? [
          {
            code: 'DUPLICATE_DOCUMENT',
            message: 'This document hash is linked to another vendor.',
            duplicateVendorCount,
          },
        ]
      : [];
    const verificationStatus = this.resolveVerificationStatusAfterChecks(
      document.verificationStatus,
      document.duplicateDetected,
      duplicateDetected,
    );

    const updatedDocument = await this.prisma.document.update({
      where: { id },
      data: {
        duplicateDetected,
        duplicateVendorCount,
        verificationReasons,
        verificationStatus,
      },
    });

    return {
      document: updatedDocument,
      duplicateSummary: {
        duplicateDetected,
        duplicateVendorCount,
        duplicateVendorIds: duplicateVendors.map((vendor) => vendor.vendorId),
      },
    };
  }

  private resolveVerificationStatusAfterChecks(
    currentStatus: DocumentVerificationStatus,
    previouslyDuplicate: boolean,
    duplicateDetected: boolean,
  ) {
    if (duplicateDetected) {
      return DocumentVerificationStatus.NEEDS_REVIEW;
    }

    if (
      currentStatus === DocumentVerificationStatus.NEEDS_REVIEW &&
      previouslyDuplicate
    ) {
      return DocumentVerificationStatus.PENDING;
    }

    return currentStatus;
  }

  private resolveVerificationStatusAfterIntelligence(
    currentStatus: DocumentVerificationStatus,
    intelligence: DocumentIntelligenceResult,
  ) {
    if (
      intelligence.aiGeneratedScore >= 90 &&
      intelligence.reasons.some(
        (reason) => reason.code === 'BUSINESS_NAME_MISMATCH',
      )
    ) {
      return DocumentVerificationStatus.REJECTED;
    }

    if (
      intelligence.aiGeneratedScore >= 70 ||
      intelligence.tamperScore >= 30 ||
      intelligence.reasons.length > 0
    ) {
      return DocumentVerificationStatus.NEEDS_REVIEW;
    }

    if (currentStatus === DocumentVerificationStatus.REJECTED) {
      return currentStatus;
    }

    return DocumentVerificationStatus.PENDING;
  }

  private async updateDocumentRisk(
    vendorId: string,
    input: {
      documentRisk: number;
      reasons: VerificationReason[];
    },
  ) {
    const documentRisk = Math.min(100, Math.max(0, input.documentRisk));

    await this.riskService.recomputeVendorRisk(vendorId, {
      documentRisk,
      identityMismatchRisk: input.reasons.some((reason) =>
        ['BUSINESS_NAME_MISMATCH', 'REGISTRATION_NUMBER_MISMATCH'].includes(
          reason.code,
        ),
      )
        ? 25
        : 0,
      manualReviewPenalty: input.reasons.some((reason) =>
        reason.code.startsWith('MANUAL_'),
      )
        ? 60
        : 0,
      reasons: input.reasons,
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
