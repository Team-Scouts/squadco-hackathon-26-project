import { PartialType } from '@nestjs/swagger';
import { CreateCloudinaryDto } from './create-cloudinary.dto.js';

export class UpdateCloudinaryDto extends PartialType(CreateCloudinaryDto) {}
