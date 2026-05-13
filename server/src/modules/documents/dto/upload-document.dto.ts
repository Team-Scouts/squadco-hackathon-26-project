import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export const SUPPORTED_DOCUMENT_TYPES = [
  'CAC_REGISTRATION',
  'TAX_ID',
  'OWNER_ID',
  'ADDRESS_PROOF',
] as const;

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty()
  vendorId: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(SUPPORTED_DOCUMENT_TYPES)
  documentType: string;
}
