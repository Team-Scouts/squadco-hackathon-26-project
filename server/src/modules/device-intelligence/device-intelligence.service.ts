import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device-dto';

@Injectable()
export class DeviceIntelligenceService {
  constructor(private prisma: PrismaService) {}

  async createDevice(createDeviceDto: CreateDeviceDto, ipAddress: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: {
        id: createDeviceDto.vendorId,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Detect reused device
    const existingDevice = await this.prisma.device.findFirst({
      where: {
        deviceHash: createDeviceDto.deviceHash,
      },
    });

    // Risk logic
    let riskScore = 0;

    if (existingDevice) {
      riskScore = 70;
    }
    //a proposed fix by manasseh : riskScore can increase shdnt be fixed.
    const device = await this.prisma.device.create({
      data: {
        vendorId: createDeviceDto.vendorId,
        deviceHash: createDeviceDto.deviceHash,
        browser: createDeviceDto.browser,
        timezone: createDeviceDto.timezone,
        ipAddress,
        riskScore,
      },
    });

    return {
      success: true,
      message: 'Device captured successfully',
      suspicious: !!existingDevice,

      data: device,
    };
  }

  async getVendorDevices(vendorId: string) {
    const devices = await this.prisma.device.findMany({
      where: {
        vendorId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      count: devices.length,
      data: devices,
    };
  }
}
