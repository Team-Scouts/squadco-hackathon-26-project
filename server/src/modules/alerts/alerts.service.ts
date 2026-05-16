import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { AlertSeverity, AlertType } from '../../generated/prisma/enums';

type RiskAlertInput = {
  vendorId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
};

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async createAlert(dto: CreateAlertDto) {
    return this.prisma.alert.create({
      data: dto,
    });
  }

  async createRiskAlert(input: RiskAlertInput) {
    const existing = await this.prisma.alert.findFirst({
      where: {
        vendorId: input.vendorId,
        type: input.type,
        title: input.title,
        resolved: false,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.alert.create({
      data: input,
    });
  }

  async getAlerts() {
    return this.prisma.alert.findMany({
      include: {
        vendor: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getActiveAlerts() {
    return this.prisma.alert.findMany({
      where: {
        resolved: false,
      },
      include: {
        vendor: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async resolveAlert(id: string) {
    return this.prisma.alert.update({
      where: { id },
      data: {
        resolved: true,
        resolvedAt: new Date(),
      },
    });
  }
}
