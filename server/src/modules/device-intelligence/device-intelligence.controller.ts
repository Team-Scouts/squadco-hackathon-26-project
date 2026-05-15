import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { AllowAnonymous, Roles } from '@thallesp/nestjs-better-auth';
import { CreateDeviceDto } from './dto/create-device-dto';
import { DeviceIntelligenceService } from './device-intelligence.service';

@Controller('devices')
export class DeviceIntelligenceController {
  constructor(private readonly devicesService: DeviceIntelligenceService) {}

  @Post()
  @AllowAnonymous()
  createDevice(@Body() createDeviceDto: CreateDeviceDto, @Req() req) {
    const ipAddress =
      req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    return this.devicesService.createDevice(createDeviceDto, ipAddress);
  }

  @Roles(['admin', 'reviewer'])
  @Get('vendor/:vendorId')
  getVendorDevices(@Param('vendorId') vendorId: string) {
    return this.devicesService.getVendorDevices(vendorId);
  }
}
