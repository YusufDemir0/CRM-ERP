import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsEmail, IsInt, IsIn, ValidateIf, Matches } from 'class-validator';
import { Type, Transform } from 'class-transformer';
export class CreatePartyDto {
  @IsEnum(['customer', 'provider'])
  type: 'customer' | 'provider';

  @IsString()
  @IsNotEmpty()
  @Matches(/^[^0-9]*$/, { message: 'Cari ad-soyad alanında rakam bulunamaz.' })
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
  @IsOptional() @IsString() @Matches(/^[^0-9]*$/, { message: 'Cari ad-soyad alanında rakam bulunamaz.' }) name?: string;
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
  @IsOptional() @IsString() isMovements?: string;
}

export class MovementsQueryDto extends PaginationDto {
  @IsOptional() @IsString() partyId?: string;
}

/** Cari ekstre satırı */
export interface StatementEntry {
  id: string;
  date: string;
  createdAt: Date | string;
  type: string;
  code: string;
  description: string;
  debit: number;
  credit: number;
  balance?: number;
  transactionId?: string;
}

/** Müşteri hareketleri map satırı */
export interface MovementRow {
  id: string;
  date: string;
  partyName: string | undefined;
  partyType: string | undefined;
  partyId: string;
  source: string;
  description: string;
  debit: number;
  credit: number;
  currency: string;
  transactionId?: string;
}
