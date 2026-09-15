import { Module } from '@nestjs/common';
import { VendorsService } from './vendors.service.js';
import { VendorsController } from './vendors.controller.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { GraphModule } from '../graph/graph.module.js';
import { DocumentsModule } from '../documents/documents.module.js';
import { TransactionsModule } from '../transactions/transactions.module.js';
import { RiskModule } from '../risk/risk.module.js';

@Module({
  imports: [GraphModule, DocumentsModule, TransactionsModule, RiskModule],
  controllers: [VendorsController],
  providers: [VendorsService, PrismaService],
})
export class VendorsModule {}
