import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsDateString, Min, IsInt, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { transformDecimalString } from '../../../common/helpers/number.helper';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateSaleItemDto {
  @IsNumber() @IsInt() @Type(() => Number) itemId: number;
  @IsNotEmpty() @Transform(transformDecimalString) @IsString() quantity: string;
  @IsNotEmpty() @Transform(transformDecimalString) @IsString() price: string;
  @IsOptional() @Transform(transformDecimalString) @IsString() discountAmount?: string;
  @IsOptional() @Transform(transformDecimalString) @IsString() discountPercent?: string;
  @IsOptional() @Transform(transformDecimalString) @IsString() kdvRate?: string;
  @IsOptional() @IsString() description?: string;
}

export class CreateSaleDto {
  @IsNumber() @IsInt() @Type(() => Number) partyId: number;
  @IsNumber() @IsInt() @Type(() => Number) saleTypeId: number;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) currencyId?: number;
  @IsOptional() @IsDateString() deliveryDate?: string;
  @IsOptional() @Transform(transformDecimalString) @IsString() deposit?: string;
  @IsOptional() @Transform(transformDecimalString) @IsString() discountAmount?: string;
  @IsOptional() @Transform(transformDecimalString) @IsString() discountPercent?: string;
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
  @IsOptional() @Transform(transformDecimalString) @IsString() deposit?: string;
  @IsOptional() @Transform(transformDecimalString) @IsString() discountAmount?: string;
  @IsOptional() @Transform(transformDecimalString) @IsString() discountPercent?: string;
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