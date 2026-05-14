import { Module } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { VendorsController } from './vendors.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { GraphModule } from '../graph/graph.module';

@Module({
  imports: [GraphModule],
  controllers: [VendorsController],
  providers: [VendorsService, PrismaService],
})
export class VendorsModule {}
