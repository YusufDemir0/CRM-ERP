import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsInt } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Type } from 'class-transformer';

export class CreateItemDto {
  @IsString() @IsNotEmpty() name: string;
  @IsNumber() @IsInt() @Type(() => Number) itemTypeId: number;
  @IsNumber() @IsInt() @Type(() => Number) itemCodeGroupId: number;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) providerId?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) criticalLimit?: number;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) purchasePrice?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) salePrice?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) netPrice?: number;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) currencyId?: number;
  @IsNumber() @IsInt() @Type(() => Number) quantityTypeId: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) kdv?: number;
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
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) criticalLimit?: number;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) purchasePrice?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) salePrice?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) netPrice?: number;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) currencyId?: number;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) quantityTypeId?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) kdv?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) state?: number;
}

export class CreateItemTypeDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() abbreviation: string;
}

export class CreateQuantityTypeDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() abbreviation: string;
}

export class CreateItemCodeGroupDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() prefix: string;
}

export class StockAdjustmentDto {
  @IsNumber() @IsInt() @Type(() => Number) itemId: number;
  @IsNumber() @IsInt() @Type(() => Number) departmentId: number;
  @IsNumber() @Min(0.0001) @Type(() => Number) quantity: number;
  @IsString() type: 'in' | 'out';
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() notes?: string;
}

// YENİ EKLENDİ: STOK TRANSFER DTO'su
export class TransferStockDto {
  @IsNumber() @IsInt() @Type(() => Number) itemId: number;
  @IsNumber() @IsInt() @Type(() => Number) fromDepartmentId: number;
  @IsNumber() @IsInt() @Type(() => Number) toDepartmentId: number;
  @IsNumber() @Min(0.0001) @Type(() => Number) quantity: number;
  @IsOptional() @IsString() description?: string;
}

export class ItemsQueryDto extends PaginationDto {
  @IsOptional() @Type(() => Number) @IsNumber() itemTypeId?: number;
  @IsOptional() @Type(() => String) search?: string; // Explicitly allowed
  @IsOptional() @IsString() critical?: string; // Sent as "true" string from browser usually
}

export class StocksQueryDto extends PaginationDto {
  @IsOptional() @Type(() => Number) @IsNumber() departmentId?: number;
  @IsOptional() @Type(() => Number) @IsNumber() itemId?: number;
  @IsOptional() isCritical?: any;
}