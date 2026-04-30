import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsInt, IsIn, IsBooleanString, IsBoolean } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Type, Transform } from 'class-transformer';
import { Decimal } from 'decimal.js';

export class CreateItemDto {
  @IsString() @IsNotEmpty() name: string;
  @IsNumber() @IsInt() @Type(() => Number) itemTypeId: number;
  @IsNumber() @IsInt() @Type(() => Number) itemCodeGroupId: number;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) providerId?: number;
  
  @IsOptional() @Transform(({ value }) => value ? new Decimal(value) : new Decimal(0)) 
  criticalLimit?: Decimal;

  @IsOptional() @IsString() image?: string;

  @IsOptional() @Transform(({ value }) => value ? new Decimal(value) : new Decimal(0))
  purchasePrice?: Decimal;

  @IsOptional() @Transform(({ value }) => value ? new Decimal(value) : new Decimal(0))
  salePrice?: Decimal;

  @IsOptional() @Transform(({ value }) => value ? new Decimal(value) : new Decimal(0))
  netPrice?: Decimal;

  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) currencyId?: number;
  @IsNumber() @IsInt() @Type(() => Number) quantityTypeId: number;

  @IsOptional() @Transform(({ value }) => value ? new Decimal(value) : new Decimal(20))
  kdv?: Decimal;

  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateItemDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) itemTypeId?: number;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) itemCodeGroupId?: number;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() code1?: string;
  @IsOptional() @IsString() code2?: string;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) providerId?: number;

  @IsOptional() @Transform(({ value }) => value ? new Decimal(value) : undefined)
  criticalLimit?: Decimal;

  @IsOptional() @IsString() image?: string;

  @IsOptional() @Transform(({ value }) => value ? new Decimal(value) : undefined)
  purchasePrice?: Decimal;

  @IsOptional() @Transform(({ value }) => value ? new Decimal(value) : undefined)
  salePrice?: Decimal;

  @IsOptional() @Transform(({ value }) => value ? new Decimal(value) : undefined)
  netPrice?: Decimal;

  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) currencyId?: number;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) quantityTypeId?: number;

  @IsOptional() @Transform(({ value }) => value ? new Decimal(value) : undefined)
  kdv?: Decimal;

  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) state?: number;
}

export class ImportItemDto {
  @IsString() @IsNotEmpty() code: string;
  @IsString() @IsNotEmpty() name: string;
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
  @IsNumber() @IsInt() @Type(() => Number) itemId: number;
  @IsNumber() @IsInt() @Type(() => Number) departmentId: number;
  @IsNumber() @Min(0.0001) @Type(() => Number) quantity: number;
  @IsString() @IsIn(['in', 'out']) type: 'in' | 'out';
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) unitCost?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() notes?: string;
}

export class TransferStockDto {
  @IsNumber() @IsInt() @Type(() => Number) itemId: number;
  @IsNumber() @IsInt() @Type(() => Number) fromDepartmentId: number;
  @IsNumber() @IsInt() @Type(() => Number) toDepartmentId: number;
  @IsNumber() @Min(0.0001) @Type(() => Number) quantity: number;
  @IsOptional() @IsString() description?: string;
}

export class ItemsQueryDto extends PaginationDto {
  @IsOptional() @Type(() => Number) @IsInt() itemTypeId?: number;
  @IsOptional() @Type(() => Number) @IsInt() providerId?: number;
  @IsOptional() @Type(() => Number) @IsInt() currencyId?: number;
  @IsOptional() @IsBooleanString() critical?: string;
}

export class StocksQueryDto extends PaginationDto {
  @IsOptional() @Type(() => Number) @IsInt() departmentId?: number;
  @IsOptional() @Type(() => Number) @IsInt() itemId?: number;
  @IsOptional() @IsBooleanString() isCritical?: string;
}