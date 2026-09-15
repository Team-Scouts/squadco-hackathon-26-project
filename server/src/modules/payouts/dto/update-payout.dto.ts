import { PartialType } from '@nestjs/swagger';
import { CreatePayoutDto } from './create-payout.dto.js';

export class UpdatePayoutDto extends PartialType(CreatePayoutDto) {}
