import { Module } from '@nestjs/common';
import { DeviceIntelligenceService } from './device-intelligence.service';
import { DeviceIntelligenceController } from './device-intelligence.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [DeviceIntelligenceController],
  providers: [DeviceIntelligenceService, PrismaService],
})
export class DeviceIntelligenceModule {}
