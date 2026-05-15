import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { GraphModule } from '../graph/graph.module';
import { DocumentIntelligenceService } from './document-intelligence.service';

@Module({
  imports: [GraphModule],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    DocumentIntelligenceService,
    PrismaService,
    CloudinaryService,
  ],
})
export class DocumentsModule {}
