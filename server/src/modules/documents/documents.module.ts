import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, PrismaService, CloudinaryService],
})
export class DocumentsModule {}
