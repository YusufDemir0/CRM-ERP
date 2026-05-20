import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString, Min, Matches, IsInt } from 'class-validator';
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

import { FinanceHelper } from '../../../common/utils/finance.helper';

export class CreateAccountDto {
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() bankName?: string;
  @IsOptional() @IsString() iban?: string;
  @IsOptional() @IsString() ibanName?: string;
  @IsString() currencyId: string;
  @IsOptional() @Transform(FinanceHelper.transform) criticalLimit?: Decimal; 
  @IsOptional() @IsString() description?: string;
}

export class UpdateAccountDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() bankName?: string;
  @IsOptional() @IsString() iban?: string;
  @IsOptional() @IsString() ibanName?: string;
  @IsOptional() @Transform(FinanceHelper.transform) criticalLimit?: Decimal;
  @IsOptional() @IsString() currencyId: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Type(() => Number) state?: number;
}

export class CreateTransactionDto {
  @IsOptional() @IsString() partyId: string;
  @IsString() commercialAccountId: string;
  @IsNotEmpty() @Transform(FinanceHelper.transformString) @IsString() amount: string; 
  @IsOptional() @IsString() currencyId: string;
  @IsEnum(['in', 'out']) type: 'in' | 'out';
  @IsOptional() @Transform(({ value }) => (value === '' || value === null) ? undefined : value) @IsEnum(['sale', 'purchase', 'manual_adjustment', 'manual', 'sale_deposit']) referenceType?: 'sale' | 'purchase' | 'manual_adjustment' | 'manual' | 'sale_deposit';
  @IsOptional() @IsString() referenceId: string;
  @IsDateString() date: string;
  @IsOptional() @IsString() description?: string;
}


export class TransactionsQueryDto extends PaginationDto {
  @IsOptional() @IsString() partyId: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() status?: string;
}

export class AccountsQueryDto extends PaginationDto {
  @IsOptional() @Type(() => Number) @IsInt() state?: number;
}