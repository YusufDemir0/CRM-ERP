import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsEmail, IsInt, IsIn, ValidateIf } from 'class-validator';
import { Type, Transform } from 'class-transformer';
export class CreatePartyDto {
  @IsEnum(['customer', 'provider'])
  type: 'customer' | 'provider';

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional() @IsString() phone1?: string;
  @IsOptional() @IsString() phone2?: string;
  @IsOptional() @IsString() taxOffice?: string;
  @IsOptional() @IsString() taxNumber?: string;
  @IsOptional()
  @ValidateIf((o) => o.email !== undefined && o.email !== null && o.email !== '')
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @Transform(({ value }) => value?.toString()) @IsString() cityId?: string;
  @IsOptional() @IsString() districtName?: string;
  @IsOptional() @IsNumber() @Type(() => Number) creditLimit?: number;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @IsString() currencyId?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() departmentId?: string;
  @IsOptional() @IsNumber() @Type(() => Number) maturityDays?: number;
}

export class UpdatePartyDto {
  @IsOptional() @IsEnum(['customer', 'provider']) type?: 'customer' | 'provider';
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone1?: string;
  @IsOptional() @IsString() phone2?: string;
  @IsOptional() @IsString() taxOffice?: string;
  @IsOptional() @IsString() taxNumber?: string;
  @IsOptional()
  @ValidateIf((o) => o.email !== undefined && o.email !== null && o.email !== '')
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @Transform(({ value }) => value?.toString()) @IsString() cityId?: string;
  @IsOptional() @IsString() districtName?: string;
  @IsOptional() @IsNumber() @Type(() => Number) creditLimit?: number;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @IsString() currencyId?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() departmentId?: string;
  @IsOptional() @IsNumber() @Type(() => Number) maturityDays?: number;
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
  @IsOptional() @IsString() departmentId?: string;
}
