import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsEmail } from 'class-validator';

export class CreatePartyDto {
  @IsEnum(['customer', 'provider', 'both'])
  type: 'customer' | 'provider' | 'both';

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional() @IsString() phone1?: string;
  @IsOptional() @IsString() phone2?: string;
  @IsOptional() @IsString() taxNumber?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsNumber() creditLimit?: number;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @IsNumber() currencyId?: number;
  @IsOptional() @IsString() notes?: string;
}

export class UpdatePartyDto {
  @IsOptional() @IsEnum(['customer', 'provider', 'both']) type?: 'customer' | 'provider' | 'both';
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone1?: string;
  @IsOptional() @IsString() phone2?: string;
  @IsOptional() @IsString() taxNumber?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsNumber() creditLimit?: number;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @IsNumber() currencyId?: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsNumber() state?: number;
}

import { PaginationDto } from '../../../common/dto/pagination.dto';
export class PartiesQueryDto extends PaginationDto {
  @IsOptional() @IsString() type?: string;
}
