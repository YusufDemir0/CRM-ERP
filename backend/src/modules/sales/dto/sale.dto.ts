import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsDateString, Min, IsInt, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { FinanceHelper } from '../../../common/utils/finance.helper';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateSaleItemDto {
  @IsString() itemId: string;
  @IsNotEmpty() @Transform(FinanceHelper.transformString) @IsString() quantity: string;
  @IsNotEmpty() @Transform(FinanceHelper.transformString) @IsString() price: string;
  @IsOptional() @Transform(FinanceHelper.transformString) @IsString() discountAmount?: string;
  @IsOptional() @Transform(FinanceHelper.transformString) @IsString() discountPercent?: string;
  @IsOptional() @Transform(FinanceHelper.transformString) @IsString() kdvRate?: string;
  @IsOptional() @IsString() description?: string;
}

export class CreateSaleDto {
  @IsString() partyId: string;
  @IsString() saleTypeId: string;
  @IsOptional() @IsString() currencyId: string;
  @IsOptional() @IsString() staffId: string;
  @IsOptional() @IsDateString() deliveryDate?: string;
  @IsOptional() @Transform(FinanceHelper.transformString) @IsString() deposit?: string;
  @IsOptional() @Transform(FinanceHelper.transformString) @IsString() discountAmount?: string;
  @IsOptional() @Transform(FinanceHelper.transformString) @IsString() discountPercent?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() taxNumber?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() commercialAccountId?: string;
  @IsOptional() @IsNumber() @Min(0) maturityDays?: number;
  @IsOptional() @IsString() paymentType?: string;
  @IsOptional() @IsNumber() @Min(1) installments?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];
}


export class UpdateSaleDto {
  @IsOptional() @IsString() partyId: string;
  @IsOptional() @IsString() currencyId: string;
  @IsOptional() @IsString() staffId: string;
  @IsOptional() @IsDateString() deliveryDate?: string;
  @IsOptional() @Transform(FinanceHelper.transformString) @IsString() deposit?: string;
  @IsOptional() @Transform(FinanceHelper.transformString) @IsString() discountAmount?: string;
  @IsOptional() @Transform(FinanceHelper.transformString) @IsString() discountPercent?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() taxNumber?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() commercialAccountId?: string;
  @IsOptional() @IsNumber() @Min(0) maturityDays?: number;
  @IsOptional() @IsString() paymentType?: string;
  @IsOptional() @IsNumber() @Min(1) installments?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items?: CreateSaleItemDto[];
}


export class CreateSaleTypeDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() abbreviation: string;
}

export class ApproveSaleDto {
  @Transform(({ value }) => value !== null && value !== undefined ? String(value) : value)
  @IsString()
  departmentId: string;

  @IsOptional()
  @Transform(({ value }) => value !== null && value !== undefined ? String(value) : value)
  @IsString()
  commercialAccountId?: string;

  @IsOptional()
  @IsArray()
  items?: { itemId: string; departmentId: string; quantity: number }[];
}

export class SalesQueryDto extends PaginationDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() partyId?: string;
  @IsOptional() @IsString() ownSalesOnly?: string | boolean;
}

export class ShipSaleDto {
  @IsArray()
  @IsOptional()
  items?: { itemId: string; quantity: string | number }[];
}