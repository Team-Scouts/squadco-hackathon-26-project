import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DocumentVerificationStatus } from '../../../generated/prisma/enums';

export class DocumentFieldVerificationDto {
  @IsString()
  label: string;

  @IsString()
  extracted: string;

  @IsString()
  verified: string;

  @IsNumber()
  confidence: number;

  @IsString()
  status: string;
}

export class UpdateDocumentVerificationDto {
  @IsEnum(DocumentVerificationStatus)
  verificationStatus: DocumentVerificationStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentFieldVerificationDto)
  extractedFields?: DocumentFieldVerificationDto[];

  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
