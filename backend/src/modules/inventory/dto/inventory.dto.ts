import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Type } from 'class-transformer';

export class CreateItemDto {
  @IsString() @IsNotEmpty() name: string;
  @IsNumber() itemTypeId: number;
  @IsNumber() itemCodeGroupId: number;
  @IsOptional() @IsNumber() providerId?: number;
  @IsOptional() @IsNumber() @Min(0) criticalLimit?: number;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsNumber() @Min(0) purchasePrice?: number;
  @IsOptional() @IsNumber() @Min(0) salePrice?: number;
  @IsOptional() @IsNumber() @Min(0) netPrice?: number;
  @IsOptional() @IsNumber() currencyId?: number;
  @IsNumber() quantityTypeId: number;
  @IsOptional() @IsNumber() @Min(0) kdv?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateItemDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsNumber() itemTypeId?: number;
  @IsOptional() @IsNumber() itemCodeGroupId?: number;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() code1?: string;
  @IsOptional() @IsString() code2?: string;
  @IsOptional() @IsNumber() providerId?: number;
  @IsOptional() @IsNumber() @Min(0) criticalLimit?: number;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsNumber() @Min(0) purchasePrice?: number;
  @IsOptional() @IsNumber() @Min(0) salePrice?: number;
  @IsOptional() @IsNumber() @Min(0) netPrice?: number;
  @IsOptional() @IsNumber() currencyId?: number;
  @IsOptional() @IsNumber() quantityTypeId?: number;
  @IsOptional() @IsNumber() @Min(0) kdv?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsNumber() state?: number;
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
  @IsNumber() itemId: number;
  @IsNumber() departmentId: number;
  @IsNumber() @Min(0.0001) quantity: number;
  @IsString() type: 'in' | 'out';
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() notes?: string;
}

// YENİ EKLENDİ: STOK TRANSFER DTO'su
export class TransferStockDto {
  @IsNumber() itemId: number;
  @IsNumber() fromDepartmentId: number;
  @IsNumber() toDepartmentId: number;
  @IsNumber() @Min(0.0001) quantity: number;
  @IsOptional() @IsString() description?: string;
}

export class ItemsQueryDto extends PaginationDto {
  @IsOptional() @Type(() => Number) @IsNumber() itemTypeId?: number;
}

export class StocksQueryDto extends PaginationDto {
  @IsOptional() @Type(() => Number) @IsNumber() departmentId?: number;
  @IsOptional() @Type(() => Number) @IsNumber() itemId?: number;
}