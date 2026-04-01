import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';

export class CreateCurrencyDto {
  @IsString() @IsNotEmpty() code: string;
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() symbol: string;
  @IsOptional() @IsNumber() exchangeRate?: number;
  @IsOptional() @IsNumber() isDefault?: number;
}

export class UpdateCurrencyDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() symbol?: string;
  @IsOptional() @IsNumber() exchangeRate?: number;
  @IsOptional() @IsNumber() isDefault?: number;
  @IsOptional() @IsNumber() state?: number;
}

export class CreateAccountDto {
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() bankName?: string;
  @IsOptional() @IsString() iban?: string;
  @IsOptional() @IsString() ibanName?: string;
  @IsNumber() currencyId: number;
  @IsOptional() @IsNumber() criticalLimit?: number;
  @IsOptional() @IsString() description?: string;
}

export class UpdateAccountDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() bankName?: string;
  @IsOptional() @IsString() iban?: string;
  @IsOptional() @IsString() ibanName?: string;
  @IsOptional() @IsNumber() criticalLimit?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() state?: number;
}

export class CreateTransactionDto {
  @IsNumber() partyId: number;
  @IsNumber() commercialAccountId: number;
  @IsNumber() amount: number;
  @IsOptional() @IsNumber() currencyId?: number;
  @IsEnum(['in', 'out']) type: 'in' | 'out';
  @IsOptional() @IsEnum(['sale', 'purchase', 'manual_adjustment']) referenceType?: 'sale' | 'purchase' | 'manual_adjustment';
  @IsOptional() @IsNumber() referenceId?: number;
  @IsDateString() date: string;
  @IsOptional() @IsString() description?: string;
}

import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Type } from 'class-transformer';

export class TransactionsQueryDto extends PaginationDto {
  @IsOptional() @Type(() => Number) @IsNumber() partyId?: number;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() status?: string;
}
