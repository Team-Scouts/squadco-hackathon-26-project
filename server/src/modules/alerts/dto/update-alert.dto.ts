import { PartialType } from '@nestjs/swagger';
import { CreateAlertDto } from './create-alert.dto.js';

export class UpdateAlertDto extends PartialType(CreateAlertDto) {}
