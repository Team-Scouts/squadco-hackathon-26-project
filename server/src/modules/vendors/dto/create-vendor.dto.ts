import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class CreateVendorDto {
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @IsEmail()
  email: string;
  @IsString()
  phone: string;
}
