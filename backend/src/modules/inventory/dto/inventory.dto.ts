import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateItemDto {
  @IsString() @IsNotEmpty() name: string;
  @IsNumber() itemTypeId: number;
  @IsOptional() @IsNumber() providerId?: number;
  @IsOptional() @IsNumber() criticalLimit?: number;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsNumber() purchasePrice?: number;
  @IsOptional() @IsNumber() salePrice?: number;
  @IsOptional() @IsNumber() netPrice?: number;
  @IsOptional() @IsNumber() currencyId?: number;
  @IsNumber() quantityTypeId: number;
  @IsOptional() @IsNumber() kdv?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateItemDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsNumber() itemTypeId?: number;
  @IsOptional() @IsNumber() providerId?: number;
  @IsOptional() @IsNumber() criticalLimit?: number;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsNumber() purchasePrice?: number;
  @IsOptional() @IsNumber() salePrice?: number;
  @IsOptional() @IsNumber() netPrice?: number;
  @IsOptional() @IsNumber() currencyId?: number;
  @IsOptional() @IsNumber() quantityTypeId?: number;
  @IsOptional() @IsNumber() kdv?: number;
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

export class StockAdjustmentDto {
  @IsNumber() itemId: number;
  @IsNumber() departmentId: number;
  @IsNumber() quantity: number;
  @IsString() type: 'in' | 'out';
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() notes?: string;
}

import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Type } from 'class-transformer';

export class ItemsQueryDto extends PaginationDto {
  @IsOptional() @Type(() => Number) @IsNumber() itemTypeId?: number;
}
export class StocksQueryDto extends PaginationDto {
  @IsOptional() @Type(() => Number) @IsNumber() departmentId?: number;
  @IsOptional() @Type(() => Number) @IsNumber() itemId?: number;
}
