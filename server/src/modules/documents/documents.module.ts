import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service.js';
import { DocumentsController } from './documents.controller.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CloudinaryService } from '../../cloudinary/cloudinary.service.js';
import { GraphModule } from '../graph/graph.module.js';
import { DocumentIntelligenceService } from './document-intelligence.service.js';
import { RiskModule } from '../risk/risk.module.js';

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
