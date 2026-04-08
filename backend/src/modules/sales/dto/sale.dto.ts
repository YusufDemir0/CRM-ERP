import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateSaleItemDto {
  @IsNumber() itemId: number;
  @IsNumber() @Min(0.0001) quantity: number;
  @IsNumber() @Min(0) price: number;
  @IsOptional() @IsNumber() @Min(0) discountAmount?: number;
  @IsOptional() @IsNumber() @Min(0) discountPercent?: number;
  @IsOptional() @IsNumber() @Min(0) kdvRate?: number;
  @IsOptional() @IsString() description?: string;
}

export class CreateSaleDto {
  @IsNumber() partyId: number;
  @IsNumber() saleTypeId: number;
  @IsOptional() @IsNumber() currencyId?: number;
  @IsOptional() @IsDateString() deliveryDate?: string;
  @IsOptional() @IsNumber() @Min(0) deposit?: number;
  @IsOptional() @IsNumber() @Min(0) discountAmount?: number;
  @IsOptional() @IsNumber() @Min(0) discountPercent?: number;
  @IsOptional() @IsString() notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];
}

export class UpdateSaleDto {
  @IsOptional() @IsNumber() partyId?: number;
  @IsOptional() @IsNumber() currencyId?: number;
  @IsOptional() @IsDateString() deliveryDate?: string;
  @IsOptional() @IsNumber() @Min(0) deposit?: number;
  @IsOptional() @IsNumber() @Min(0) discountAmount?: number;
  @IsOptional() @IsNumber() @Min(0) discountPercent?: number;
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
  @IsNumber() departmentId: number;
  @IsOptional() @IsNumber() commercialAccountId?: number;
}

export class SalesQueryDto extends PaginationDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @Type(() => Number) @IsNumber() partyId?: number;
}