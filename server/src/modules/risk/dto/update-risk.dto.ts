import { PartialType } from '@nestjs/swagger';
import { CreateRiskDto } from './create-risk.dto.js';

export class UpdateRiskDto extends PartialType(CreateRiskDto) {}
