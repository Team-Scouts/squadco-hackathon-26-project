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
import { DocumentVerificationStatus } from '../../generated/prisma/enums';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private graphService: GraphService,
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
      },
    });

    const { document: checkedDocument, duplicateSummary } =
      await this.applyDuplicateChecks(document.id);
    const graphSynced = await this.graphService.safeSyncVendorById(vendor.id);

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
    const graphSynced = await this.graphService.safeSyncVendorById(
      document.vendorId,
    );

    return {
      success: true,
      message: 'Document checks completed',
      data: document,
      duplicateSummary,
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
}
