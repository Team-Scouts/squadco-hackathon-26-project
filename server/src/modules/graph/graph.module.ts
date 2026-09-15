import { Module } from '@nestjs/common';
import { GraphService } from './graph.service.js';
import { GraphController } from './graph.controller.js';
import { Neo4jModule } from '../../neo4j/neo4j.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [Neo4jModule, PrismaModule],
  controllers: [GraphController],
  providers: [GraphService],
  exports: [GraphService],
})
export class GraphModule {}
