import { Injectable, NotFoundException } from '@nestjs/common';

import { UploadDocumentDto } from './dto/upload-document.dto';

import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async uploadDocument(
    file: Express.Multer.File,
    uploadDocumentDto: UploadDocumentDto,
  ) {
    const vendor = await this.prisma.vendor.findUnique({
      where: {
        id: uploadDocumentDto.vendorId,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Upload to Cloudinary
    const uploadedFile: any = await this.cloudinaryService.uploadFile(file);

    // Generate placeholder hash
    const documentHash = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    // Save to database
    const document = await this.prisma.document.create({
      data: {
        vendorId: uploadDocumentDto.vendorId,
        documentType: uploadDocumentDto.documentType,
        fileUrl: uploadedFile.secure_url,
        documentHash,
      },
    });

    return {
      success: true,
      message: 'Document uploaded successfully',
      data: document,
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
}
