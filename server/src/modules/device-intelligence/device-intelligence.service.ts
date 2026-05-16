import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device-dto';
import { GraphService } from '../graph/graph.service';
import { RiskLevel } from '../../generated/prisma/enums';
import { RiskService } from '../risk/risk.service';

type DeviceRiskReason = {
  code: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  scoreImpact: number;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class DeviceIntelligenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly graphService: GraphService,
    private readonly riskService: RiskService,
  ) {}

  async createDevice(createDeviceDto: CreateDeviceDto, ipAddress: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: {
        id: createDeviceDto.vendorId,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const reusedVendorIds = await this.prisma.device.findMany({
      where: {
        deviceHash: createDeviceDto.deviceHash,
        vendorId: {
          not: createDeviceDto.vendorId,
        },
      },
      distinct: ['vendorId'],
      select: {
        vendorId: true,
      },
    });
    const reusedVendorCount = reusedVendorIds.length;
    const suspicious = reusedVendorCount > 0;
    const riskScore = suspicious ? 70 : 0;
    const existingVendorDevice = await this.prisma.device.findFirst({
      where: {
        vendorId: createDeviceDto.vendorId,
        deviceHash: createDeviceDto.deviceHash,
      },
    });

    const device = existingVendorDevice
      ? await this.prisma.device.update({
          where: {
            id: existingVendorDevice.id,
          },
          data: {
            browser: createDeviceDto.browser,
            timezone: createDeviceDto.timezone,
            ipAddress: this.normalizeIpAddress(ipAddress),
            riskScore,
          },
        })
      : await this.prisma.device.create({
          data: {
            vendorId: createDeviceDto.vendorId,
            deviceHash: createDeviceDto.deviceHash,
            browser: createDeviceDto.browser,
            timezone: createDeviceDto.timezone,
            ipAddress: this.normalizeIpAddress(ipAddress),
            riskScore,
          },
        });

    const risk = await this.updateDeviceRisk(createDeviceDto.vendorId, {
      suspicious,
      reusedVendorCount,
      deviceId: device.id,
      deviceHash: device.deviceHash,
    });
    const graphSynced = await this.graphService.safeSyncVendorById(
      createDeviceDto.vendorId,
    );

    return {
      success: true,
      message: 'Device captured successfully',
      suspicious,
      reusedVendorCount,
      data: device,
      risk,
      graphSynced,
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

  private async updateDeviceRisk(
    vendorId: string,
    input: {
      suspicious: boolean;
      reusedVendorCount: number;
      deviceId: string;
      deviceHash: string;
    },
  ) {
    const devices = await this.prisma.device.findMany({
      where: { vendorId },
    });
    const deviceRisk = Math.max(0, ...devices.map((device) => device.riskScore));
    const reasons: DeviceRiskReason[] = input.suspicious
      ? [
          {
            code: 'SHARED_DEVICE_FINGERPRINT',
            message: 'This device fingerprint is linked to another vendor.',
            severity: 'HIGH',
            scoreImpact: 70,
            metadata: {
              deviceId: input.deviceId,
              deviceHash: input.deviceHash,
              reusedVendorCount: input.reusedVendorCount,
            },
          },
        ]
      : [];
    const risk = await this.riskService.recomputeVendorRisk(vendorId, {
      deviceRisk,
      reasons,
    });

    return {
      deviceRisk,
      overallRisk: risk.overallRisk,
      riskLevel: risk.riskLevel,
      recommendedAction: risk.recommendedAction,
      reasons,
      riskScore: risk.riskScore,
    };
  }

  private normalizeIpAddress(ipAddress: string) {
    if (Array.isArray(ipAddress)) {
      return ipAddress[0] ?? '';
    }

    return String(ipAddress ?? '').split(',')[0].trim();
  }

  private resolveRiskLevel(score: number) {
    if (score >= 85) {
      return RiskLevel.CRITICAL;
    }

    if (score >= 60) {
      return RiskLevel.HIGH;
    }

    if (score >= 30) {
      return RiskLevel.MEDIUM;
    }

    return RiskLevel.LOW;
  }

  private resolveRecommendedAction(riskLevel: RiskLevel) {
    if (riskLevel === RiskLevel.CRITICAL) {
      return 'REJECT_AND_ESCALATE';
    }

    if (riskLevel === RiskLevel.HIGH) {
      return 'REQUIRE_MANUAL_REVIEW';
    }

    if (riskLevel === RiskLevel.MEDIUM) {
      return 'REVIEW_BEFORE_APPROVAL';
    }

    return 'APPROVE_IF_OTHER_CHECKS_PASS';
  }
}
