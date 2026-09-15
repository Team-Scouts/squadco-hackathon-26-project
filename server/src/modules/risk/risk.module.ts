import { Module } from '@nestjs/common';
import { RiskService } from './risk.service.js';
import { RiskController } from './risk.controller.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AlertsModule } from '../alerts/alerts.module.js';

@Module({
  imports: [PrismaModule, AlertsModule],
  controllers: [RiskController],
  providers: [RiskService],
  exports: [RiskService],
})
export class RiskModule {}
