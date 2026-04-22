import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsEmail, IsInt, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePartyDto {
  @IsEnum(['customer', 'provider', 'both'])
  type: 'customer' | 'provider' | 'both';

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional() @IsString() phone1?: string;
  @IsOptional() @IsString() phone2?: string;
  @IsOptional() @IsString() taxOffice?: string;
  @IsOptional() @IsString() taxNumber?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) cityId?: number;
  @IsOptional() @IsString() districtName?: string;
  @IsOptional() @IsNumber() @Type(() => Number) creditLimit?: number;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) currencyId?: number;
  @IsOptional() @IsString() notes?: string;
}

export class UpdatePartyDto {
  @IsOptional() @IsEnum(['customer', 'provider', 'both']) type?: 'customer' | 'provider' | 'both';
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone1?: string;
  @IsOptional() @IsString() phone2?: string;
  @IsOptional() @IsString() taxOffice?: string;
  @IsOptional() @IsString() taxNumber?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) cityId?: number;
  @IsOptional() @IsString() districtName?: string;
  @IsOptional() @IsNumber() @Type(() => Number) creditLimit?: number;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) currencyId?: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional()
  @IsNumber()
  @IsInt()
  @IsIn([0, 1])
  @Type(() => Number)
  state?: number;
}

import { PaginationDto } from '../../../common/dto/pagination.dto';
export class PartiesQueryDto extends PaginationDto {
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) state?: number;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) departmentId?: number;
}
