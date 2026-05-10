import { Controller, Get, Param, Post } from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import { GraphService } from './graph.service';

@Roles(['ADMIN', 'REVIEWER', 'admin', 'reviewer'])
@Controller('graph')
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  @Get('vendors/:id')
  getVendorGraph(@Param('id') id: string) {
    return this.graphService.getVendorGraph(id);
  }

  @Get('shared-devices')
  getSharedDevices() {
    return this.graphService.getSharedDevices();
  }

  @Get('shared-accounts')
  getSharedAccounts() {
    return this.graphService.getSharedAccounts();
  }

  @Get('duplicate-documents')
  getDuplicateDocuments() {
    return this.graphService.getDuplicateDocuments();
  }

  @Get('fraud-clusters')
  getFraudClusters() {
    return this.graphService.getFraudClusters();
  }

  @Post('sync')
  syncExistingPrismaDataToGraph() {
    return this.graphService.syncExistingPrismaDataToGraph();
  }
}
