import { Module } from '@nestjs/common';
import { DeviceIntelligenceService } from './device-intelligence.service';
import { DeviceIntelligenceController } from './device-intelligence.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { GraphModule } from '../graph/graph.module';

@Module({
  imports: [PrismaModule, GraphModule],
  controllers: [DeviceIntelligenceController],
  providers: [DeviceIntelligenceService],
})
export class DeviceIntelligenceModule {}
