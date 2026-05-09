import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { SquadModule } from './modules/squad/squad.module';
import { RiskModule } from './modules/risk/risk.module';
import { GraphModule } from './modules/graph/graph.module';
import { DeviceIntelligenceModule } from './modules/device-intelligence/device-intelligence.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { AdminModule } from './modules/admin/admin.module';
import { PayoutsModule } from './modules/payouts/payouts.module';

@Module({
  imports: [PrismaModule, AuthModule, VendorsModule, DocumentsModule, TransactionsModule, SquadModule, RiskModule, GraphModule, DeviceIntelligenceModule, AlertsModule, AdminModule, PayoutsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
