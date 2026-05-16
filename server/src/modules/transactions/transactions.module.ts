import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { GraphModule } from '../graph/graph.module';
import { RiskModule } from '../risk/risk.module';

@Module({
  imports: [PrismaModule, GraphModule, RiskModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
