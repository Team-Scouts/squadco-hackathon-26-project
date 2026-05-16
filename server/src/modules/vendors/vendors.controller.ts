import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { VendorsService } from './vendors.service';

import { CreateVendorDto } from './dto/create-vendor.dto';

import { UpdateVendorDto } from './dto/update-vendor.dto';
import { OptionalAuth, Roles } from '@thallesp/nestjs-better-auth';

@OptionalAuth()
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  // CREATE
  @Post()
  createVendor(@Body() createVendorDto: CreateVendorDto) {
    return this.vendorsService.createVendor(createVendorDto);
  }

  // GET ALL
  @Get()
  getVendors() {
    return this.vendorsService.getVendors();
  }

  @Post(':id/run-checks')
  runChecks(@Param('id') id: string) {
    return this.vendorsService.runChecks(id);
  }

  // GET ONE
  @Get(':id')
  getVendorById(@Param('id') id: string) {
    return this.vendorsService.getVendorById(id);
  }

  // UPDATE STATUS
  @Patch(':id')
  updateVendor(
    @Param('id') id: string,
    @Body() updateVendorDto: UpdateVendorDto,
  ) {
    return this.vendorsService.updateVendor(id, updateVendorDto);
  }

  @Delete(':id')
  @Roles(['admin', 'reviewer'])
  deleteVendor(@Param('id') id: string) {
    return this.vendorsService.deleteVendor(id);
  }
}
