import { Module } from '@nestjs/common';
import { DeviceIntelligenceService } from './device-intelligence.service.js';
import { DeviceIntelligenceController } from './device-intelligence.controller.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { GraphModule } from '../graph/graph.module.js';
import { RiskModule } from '../risk/risk.module.js';

@Module({
  imports: [PrismaModule, GraphModule, RiskModule],
  controllers: [DeviceIntelligenceController],
  providers: [DeviceIntelligenceService],
})
export class DeviceIntelligenceModule {}
