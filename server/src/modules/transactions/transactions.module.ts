import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service.js';
import { TransactionsController } from './transactions.controller.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { GraphModule } from '../graph/graph.module.js';
import { RiskModule } from '../risk/risk.module.js';

@Module({
  imports: [PrismaModule, GraphModule, RiskModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
