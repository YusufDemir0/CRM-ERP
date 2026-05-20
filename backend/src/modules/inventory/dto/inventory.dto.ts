import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsInt, IsIn, IsBooleanString, IsBoolean } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Type, Transform } from 'class-transformer';
import { Decimal } from 'decimal.js';

export class CreateItemDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() itemTypeId: string;
  @IsOptional() @IsString() itemCodeGroupId: string;
  @IsOptional() @IsString() providerId: string;
  
  @IsOptional() @Transform(({ value }) => (value !== undefined && value !== null) ? new Decimal(value) : new Decimal(0)) 
  criticalLimit?: Decimal;

  @IsOptional() @IsString() image?: string;

  @IsOptional() @Transform(({ value }) => value ? new Decimal(value) : new Decimal(0))
  purchasePrice?: Decimal;

  @IsOptional() @Transform(({ value }) => value ? new Decimal(value) : new Decimal(0))
  salePrice?: Decimal;

  @IsOptional() @Transform(({ value }) => value ? new Decimal(value) : new Decimal(0))
  netPrice?: Decimal;

  @IsOptional() @IsString() currencyId: string;
  @IsString() @IsNotEmpty() quantityTypeId: string;

  @IsOptional() @Transform(({ value }) => value ? new Decimal(value) : new Decimal(20))
  kdv?: Decimal;

  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateItemDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() itemTypeId: string;
  @IsOptional() @IsString() itemCodeGroupId: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() code1?: string;
  @IsOptional() @IsString() code2?: string;
  @IsOptional() @IsString() providerId: string;

  @IsOptional() @Transform(({ value }) => (value !== undefined && value !== null) ? new Decimal(value) : undefined)
  criticalLimit?: Decimal;

  @IsOptional() @IsString() image?: string;

  @IsOptional() @Transform(({ value }) => (value !== undefined && value !== null) ? new Decimal(value) : undefined)
  purchasePrice?: Decimal;

  @IsOptional() @Transform(({ value }) => (value !== undefined && value !== null) ? new Decimal(value) : undefined)
  salePrice?: Decimal;

  @IsOptional() @Transform(({ value }) => (value !== undefined && value !== null) ? new Decimal(value) : undefined)
  netPrice?: Decimal;

  @IsOptional() @IsString() currencyId: string;
  @IsOptional() @IsString() quantityTypeId: string;

  @IsOptional() @Transform(({ value }) => (value !== undefined && value !== null) ? new Decimal(value) : undefined)
  kdv?: Decimal;

  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) state?: number;
}

export class ImportItemDto {
  @IsString() @IsNotEmpty() code: string;
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() typeName?: string;
  @IsOptional() @IsString() unitName?: string;
  @IsOptional() @IsNumber() @Type(() => Number) purchasePrice?: number;
  @IsOptional() @IsNumber() @Type(() => Number) salePrice?: number;
  @IsOptional() @IsNumber() @Type(() => Number) criticalLimit?: number;
  @IsOptional() @IsNumber() @Type(() => Number) kdv?: number;
}

export class CreateItemTypeDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() abbreviation: string;
  @IsOptional() @IsBoolean() isExcludedFromBom?: boolean;
}

export class UpdateItemTypeDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() abbreviation?: string;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) state?: number;
  @IsOptional() @IsBoolean() isExcludedFromBom?: boolean;
}

export class CreateQuantityTypeDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() abbreviation: string;
}

export class UpdateQuantityTypeDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() abbreviation?: string;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) state?: number;
}

export class CreateItemCodeGroupDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() prefix: string;
}

export class UpdateItemCodeGroupDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() prefix?: string;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) state?: number;
}

export class StockAdjustmentDto {
  @IsString() itemId: string;
  @IsString() departmentId: string;
  @IsNumber() @Min(0.0001) @Type(() => Number) quantity: number;
  @IsString() @IsIn(['in', 'out']) type: 'in' | 'out';
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) unitCost?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() notes?: string;
}

export class TransferStockDto {
  @IsString() itemId: string;
  @IsString() fromDepartmentId: string;
  @IsString() toDepartmentId: string;
  @IsNumber() @Min(0.0001) @Type(() => Number) quantity: number;
  @IsOptional() @IsString() description?: string;
}

export class ItemsQueryDto extends PaginationDto {
  @IsOptional() @IsString() itemTypeId: string;
  @IsOptional() @IsString() providerId: string;
  @IsOptional() @IsString() currencyId: string;
  @IsOptional() @IsBooleanString() critical?: string;
}

export class StocksQueryDto extends PaginationDto {
  @IsOptional() @IsString() departmentId: string;
  @IsOptional() @IsString() itemId: string;
  @IsOptional() @IsBooleanString() isCritical?: string;
}