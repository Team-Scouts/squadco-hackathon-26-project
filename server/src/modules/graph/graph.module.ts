import { Module } from '@nestjs/common';
import { GraphService } from './graph.service';
import { GraphController } from './graph.controller';
import { Neo4jModule } from '../../neo4j/neo4j.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [Neo4jModule, PrismaModule],
  controllers: [GraphController],
  providers: [GraphService],
  exports: [GraphService],
})
export class GraphModule {}
