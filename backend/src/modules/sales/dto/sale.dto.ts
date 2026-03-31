import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSaleItemDto {
  @IsNumber() itemId: number;
  @IsNumber() quantity: number;
  @IsNumber() price: number;
  @IsOptional() @IsNumber() discountAmount?: number;
  @IsOptional() @IsNumber() discountPercent?: number;
  @IsOptional() @IsNumber() kdvRate?: number;
  @IsOptional() @IsString() description?: string;
}

export class CreateSaleDto {
  @IsNumber() partyId: number;
  @IsNumber() saleTypeId: number;
  @IsOptional() @IsNumber() currencyId?: number;
  @IsOptional() @IsDateString() deliveryDate?: string;
  @IsOptional() @IsNumber() deposit?: number;
  @IsOptional() @IsNumber() discountAmount?: number;
  @IsOptional() @IsNumber() discountPercent?: number;
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
  @IsOptional() @IsNumber() deposit?: number;
  @IsOptional() @IsNumber() discountAmount?: number;
  @IsOptional() @IsNumber() discountPercent?: number;
  @IsOptional() @IsString() notes?: string;
}

export class CreateSaleTypeDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() abbreviation: string;
}

/**
 * Sipariş onaylama DTO'su.
 * departmentId: Stok hangi departmandan düşülecek (kullanıcının departmanı varsayılanır).
 */
export class ApproveSaleDto {
  @IsNumber() departmentId: number;
}
