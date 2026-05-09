import { PartialType } from '@nestjs/swagger';
import { CreateGraphDto } from './create-graph.dto';

export class UpdateGraphDto extends PartialType(CreateGraphDto) {}
