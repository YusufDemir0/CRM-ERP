import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString, Min, Matches } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Type, Transform } from 'class-transformer';
import { Decimal } from 'decimal.js';

export class CreateCurrencyDto {
  @IsString() @IsNotEmpty() code: string;
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() symbol: string;
  @IsOptional() @IsNumber() @Min(0) exchangeRate?: number;
  @IsOptional() @IsNumber() isDefault?: number;
}

export class UpdateCurrencyDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() symbol?: string;
  @IsOptional() @IsNumber() @Min(0) exchangeRate?: number;
  @IsOptional() @IsNumber() isDefault?: number;
  @IsOptional() @IsNumber() state?: number;
}

export class CreateAccountDto {
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() bankName?: string;
  @IsOptional() @IsString() iban?: string;
  @IsOptional() @IsString() ibanName?: string;
  @IsNumber() @Type(() => Number) currencyId: number;
  @IsOptional() @Transform(({ value }) => value ? new Decimal(value) : undefined) criticalLimit?: Decimal; 
  @IsOptional() @IsString() description?: string;
}

export class UpdateAccountDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() bankName?: string;
  @IsOptional() @IsString() iban?: string;
  @IsOptional() @IsString() ibanName?: string;
  @IsOptional() @Transform(({ value }) => value ? new Decimal(value) : undefined) criticalLimit?: Decimal;
  @IsOptional() @IsNumber() @Type(() => Number) currencyId?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Type(() => Number) state?: number;
}

export class CreateTransactionDto {
  @IsOptional() @Type(() => Number) @IsNumber() partyId?: number;
  @Type(() => Number) @IsNumber() commercialAccountId: number;
  @IsNotEmpty() @Transform(({ value }) => value !== undefined && value !== null ? value.toString() : value) @IsString() @Matches(/^-?\d+(\.\d+)?$/, { message: 'Tutar geçerli bir sayı formatında (örn: 100.50) olmalıdır' }) amount: string; 
  @IsOptional() @Type(() => Number) @IsNumber() currencyId?: number;
  @IsEnum(['in', 'out']) type: 'in' | 'out';
  @IsOptional() @Transform(({ value }) => (value === '' || value === null) ? undefined : value) @IsEnum(['sale', 'purchase', 'manual_adjustment', 'manual']) referenceType?: 'sale' | 'purchase' | 'manual_adjustment' | 'manual';
  @IsOptional() @Type(() => Number) @IsNumber() referenceId?: number;
  @IsDateString() date: string;
  @IsOptional() @IsString() description?: string;
}

export class TransactionsQueryDto extends PaginationDto {
  @IsOptional() @Type(() => Number) @IsNumber() partyId?: number;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() status?: string;
}