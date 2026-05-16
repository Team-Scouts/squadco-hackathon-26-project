import { Module } from '@nestjs/common';
import { RiskService } from './risk.service';
import { RiskController } from './risk.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [PrismaModule, AlertsModule],
  controllers: [RiskController],
  providers: [RiskService],
  exports: [RiskService],
})
export class RiskModule {}
