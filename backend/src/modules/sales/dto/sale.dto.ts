import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsDateString, Min, IsInt, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateSaleItemDto {
  @IsNumber() @IsInt() @Type(() => Number) itemId: number;
  @IsNumber() @Min(0.0001) @Type(() => Number) quantity: number;
  @IsNumber() @Min(0) @Type(() => Number) price: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) discountAmount?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) discountPercent?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) kdvRate?: number;
  @IsOptional() @IsString() description?: string;
}

export class CreateSaleDto {
  @IsNumber() @IsInt() @Type(() => Number) partyId: number;
  @IsNumber() @IsInt() @Type(() => Number) saleTypeId: number;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) currencyId?: number;
  @IsOptional() @IsDateString() deliveryDate?: string;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) deposit?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) discountAmount?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) discountPercent?: number;
  @IsOptional() @IsString() notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];
}

export class UpdateSaleDto {
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) partyId?: number;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) currencyId?: number;
  @IsOptional() @IsDateString() deliveryDate?: string;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) deposit?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) discountAmount?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) discountPercent?: number;
  @IsOptional() @IsString() notes?: string;

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