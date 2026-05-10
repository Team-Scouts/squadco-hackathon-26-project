import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Neo4jService } from './neo4j.service';
import { Neo4jController } from './neo4j.controller';

@Module({
  imports: [ConfigModule],
  controllers: [Neo4jController],
  providers: [Neo4jService],
  exports: [Neo4jService],
})
export class Neo4jModule {}
