import { Module } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { VendorsController } from './vendors.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { GraphModule } from '../graph/graph.module';
import { DocumentsModule } from '../documents/documents.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { RiskModule } from '../risk/risk.module';

@Module({
  imports: [GraphModule, DocumentsModule, TransactionsModule, RiskModule],
  controllers: [VendorsController],
  providers: [VendorsService, PrismaService],
})
export class VendorsModule {}
