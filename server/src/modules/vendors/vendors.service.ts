import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateVendorDto } from './dto/create-vendor.dto';

import { PrismaService } from '../../prisma/prisma.service';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { GraphService } from '../graph/graph.service';

@Injectable()
export class VendorsService {
  constructor(
    private prisma: PrismaService,
    private graphService: GraphService,
  ) {}

  // CREATE VENDOR
  async createVendor(createVendorDto: CreateVendorDto) {
    const vendor = await this.prisma.vendor.create({
      data: {
        ...createVendorDto,
      },
    });
    const graphSynced = await this.graphService.safeSyncVendorById(vendor.id);

    return {
      success: true,
      message: 'Vendor created successfully',
      data: vendor,
      graphSynced,
    };
  }

  // GET ALL VENDORS
  async getVendors() {
    const vendors = await this.prisma.vendor.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      count: vendors.length,
      data: vendors,
    };
  }

  // GET SINGLE VENDOR
  async getVendorById(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },

      include: {
        documents: true,
        devices: true,
        transactions: true,
        alerts: true,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return {
      success: true,
      data: vendor,
    };
  }

  // UPDATE STATUS
  async updateVendor(id: string, updateVendorDto: UpdateVendorDto) {
    const existingVendor = await this.prisma.vendor.findUnique({
      where: { id },
    });

    if (!existingVendor) {
      throw new NotFoundException('Vendor not found');
    }

    const updatedVendor = await this.prisma.vendor.update({
      where: { id },

      data: {
        ...updateVendorDto,
      },
    });
    const graphSynced = await this.graphService.safeSyncVendorById(
      updatedVendor.id,
    );

    return {
      success: true,
      message: 'Vendor updated successfully',
      data: updatedVendor,
      graphSynced,
    };
  }
}
