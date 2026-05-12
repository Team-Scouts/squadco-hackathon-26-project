import { Module } from '@nestjs/common';
import { DeviceIntelligenceService } from './device-intelligence.service';
import { DeviceIntelligenceController } from './device-intelligence.controller';

@Module({
  controllers: [DeviceIntelligenceController],
  providers: [DeviceIntelligenceService],
})
export class DeviceIntelligenceModule {}
