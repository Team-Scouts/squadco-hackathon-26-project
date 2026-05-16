import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { GraphModule } from '../graph/graph.module';
import { DocumentIntelligenceService } from './document-intelligence.service';
import { RiskModule } from '../risk/risk.module';

@Module({
  imports: [GraphModule, RiskModule],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    DocumentIntelligenceService,
    PrismaService,
    CloudinaryService,
  ],
  exports: [DocumentsService],
})
export class DocumentsModule {}
