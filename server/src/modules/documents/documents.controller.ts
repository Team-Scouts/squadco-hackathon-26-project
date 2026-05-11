import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { DocumentsService } from './documents.service';

import { UploadDocumentDto } from './dto/upload-document.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDocumentDto: UploadDocumentDto,
    @Req() req,
  ) {
    console.log(req.user);
    console.log(file);
    return this.documentsService.uploadDocument(file, uploadDocumentDto);
  }

  @Get('vendor/:vendorId')
  getVendorDocuments(@Param('vendorId') vendorId: string) {
    return this.documentsService.getVendorDocuments(vendorId);
  }
}
