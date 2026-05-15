import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAlertDto } from './dto/create-alert.dto';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async createAlert(dto: CreateAlertDto) {
    return this.prisma.alert.create({
      data: dto,
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
