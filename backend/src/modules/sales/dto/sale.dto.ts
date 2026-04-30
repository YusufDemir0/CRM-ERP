import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsDateString, Min, IsInt, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { FinanceHelper } from '../../../common/utils/finance.helper';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateSaleItemDto {
  @IsNumber() @IsInt() @Type(() => Number) itemId: number;
  @IsNotEmpty() @Transform(FinanceHelper.transformString) @IsString() quantity: string;
  @IsNotEmpty() @Transform(FinanceHelper.transformString) @IsString() price: string;
  @IsOptional() @Transform(FinanceHelper.transformString) @IsString() discountAmount?: string;
  @IsOptional() @Transform(FinanceHelper.transformString) @IsString() discountPercent?: string;
  @IsOptional() @Transform(FinanceHelper.transformString) @IsString() kdvRate?: string;
  @IsOptional() @IsString() description?: string;
}

export class CreateSaleDto {
  @IsNumber() @IsInt() @Type(() => Number) partyId: number;
  @IsNumber() @IsInt() @Type(() => Number) saleTypeId: number;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) currencyId?: number;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) staffId?: number;
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
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) commercialAccountId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];
}


export class UpdateSaleDto {
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) partyId?: number;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) currencyId?: number;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) staffId?: number;
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
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) commercialAccountId?: number;

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
  @IsNumber() @IsInt() @Type(() => Number) departmentId: number;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) commercialAccountId?: number;
}

export class SalesQueryDto extends PaginationDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @Type(() => Number) @IsNumber() partyId?: number;
}

export class ShipSaleDto {
  @IsArray()
  @IsOptional()
  items?: { itemId: number; quantity: number }[];
}