import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateVendorDto } from './dto/create-vendor.dto';

import { PrismaService } from '../../prisma/prisma.service';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { GraphService } from '../graph/graph.service';
import { SquadService } from '../squad/squad.service';
import { DocumentsService } from '../documents/documents.service';
import { TransactionsService } from '../transactions/transactions.service';
import { RiskService } from '../risk/risk.service';

const testVirtualAccountObject = {
  address: '22 Kota street, UK',
  beneficiary_account: '4920299492',
  bvn: '22343211654',
  customer_identifier: '',
  dob: '07/19/1990',
  email: 'ayo@squad.com',
  first_name: 'Jimmy',
  gender: '1',
  last_name: 'Neutron',
  mobile_num: '08123446789',
};

@Injectable()
export class VendorsService {
  constructor(
    private prisma: PrismaService,
    private graphService: GraphService,
    private squad: SquadService,
    private documentsService: DocumentsService,
    private transactionsService: TransactionsService,
    private riskService: RiskService,
  ) {}

  // CREATE VENDOR
  async createVendor(createVendorDto: CreateVendorDto) {
    // const userVirtualAccount = await this.squad.virtualAccount({
    //   ...testVirtualAccountObject,
    //   email: createVendorDto.email,
    //   mobile_num: createVendorDto.phone,
    //   first_name: createVendorDto.firstName,
    //   last_name: createVendorDto.lastName,
    //   customer_identifier: createVendorDto.email,
    //   bvn: `22${createVendorDto.phone.slice(2, 11)}`,
    // });
    const vendor = await this.prisma.vendor.create({
      data: {
        businessName: createVendorDto.businessName,
        registrationNumber: createVendorDto.registrationNumber,
        vendorType: createVendorDto.vendorType,
        sector: createVendorDto.sector,
        contactName: createVendorDto.contactName,
        email: createVendorDto.email,
        phone: createVendorDto.phone,
        country: createVendorDto.country,
        state: createVendorDto.state,
        address: createVendorDto.address,
      },
    });
    const graphSynced = await this.graphService.safeSyncVendorById(vendor.id);
    const risk = await this.riskService.recomputeVendorRisk(vendor.id);

    return {
      success: true,
      message: 'Vendor created successfully',
      data: vendor,
      graphSynced,
      checksStatus: 'COMPLETED',
      risk,
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
        transfers: {
          include: {
            bankAccount: true,
          },
        },
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

  async runChecks(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const documents = await this.documentsService.runVendorChecks(id);
    const financial = await this.transactionsService.evaluateVendorFinancialRisk(id);
    const risk = await this.riskService.recomputeVendorRisk(id);
    const graphSynced = await this.graphService.safeSyncVendorById(id);

    return {
      success: true,
      message: 'Vendor checks completed',
      checksStatus: 'COMPLETED',
      documents,
      financial,
      risk,
      graphSynced,
    };
  }
}
