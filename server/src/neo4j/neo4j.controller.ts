import { Controller, Get } from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import { Neo4jService } from './neo4j.service';

@Roles(['admin', 'reviewer'])
@Controller('neo4j')
export class Neo4jController {
  constructor(private readonly neo4jService: Neo4jService) {}

  @Get('health')
  health() {
    return this.neo4jService.health();
  }
}
