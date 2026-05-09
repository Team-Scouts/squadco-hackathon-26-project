import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DeviceIntelligenceService } from './device-intelligence.service';
import { CreateDeviceIntelligenceDto } from './dto/create-device-intelligence.dto';
import { UpdateDeviceIntelligenceDto } from './dto/update-device-intelligence.dto';

@Controller('device-intelligence')
export class DeviceIntelligenceController {
  constructor(private readonly deviceIntelligenceService: DeviceIntelligenceService) {}

  @Post()
  create(@Body() createDeviceIntelligenceDto: CreateDeviceIntelligenceDto) {
    return this.deviceIntelligenceService.create(createDeviceIntelligenceDto);
  }

  @Get()
  findAll() {
    return this.deviceIntelligenceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deviceIntelligenceService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDeviceIntelligenceDto: UpdateDeviceIntelligenceDto) {
    return this.deviceIntelligenceService.update(+id, updateDeviceIntelligenceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deviceIntelligenceService.remove(+id);
  }
}
