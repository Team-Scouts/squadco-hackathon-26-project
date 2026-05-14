import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';

import { FileInterceptor } from '@nestjs/platform-express';

import { DocumentsService } from './documents.service';

import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateDocumentVerificationDto } from './dto/update-document-verification.dto';

@Roles(['admin', 'reviewer'])
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDocumentDto: UploadDocumentDto,
  ) {
    return this.documentsService.uploadDocument(file, uploadDocumentDto);
  }

  @Get('vendor/:vendorId')
  getVendorDocuments(@Param('vendorId') vendorId: string) {
    return this.documentsService.getVendorDocuments(vendorId);
  }

  @Get(':id')
  getDocumentById(@Param('id') id: string) {
    return this.documentsService.getDocumentById(id);
  }

  @Patch(':id/verification')
  updateVerification(
    @Param('id') id: string,
    @Body() updateDocumentVerificationDto: UpdateDocumentVerificationDto,
  ) {
    return this.documentsService.updateVerification(
      id,
      updateDocumentVerificationDto,
    );
  }

  @Post(':id/run-checks')
  runChecks(@Param('id') id: string) {
    return this.documentsService.runChecks(id);
  }
}
