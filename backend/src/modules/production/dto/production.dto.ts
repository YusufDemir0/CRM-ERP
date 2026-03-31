import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBomItemDto {
  @IsNumber() itemId: number;
  @IsNumber() quantity: number;
  @IsOptional() @IsString() description?: string;
}

export class CreateBomDto {
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBomItemDto)
  items: CreateBomItemDto[];
}

export class UpdateBomDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() state?: number;
}

export class CreateProductionOrderDto {
  @IsNumber() bomId: number;
  @IsNumber() plannedQuantity: number;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateProductionOrderDto {
  @IsOptional() @IsNumber() producedQuantity?: number;
  @IsOptional() @IsNumber() wastageQuantity?: number;
  @IsOptional() @IsEnum(['draft', 'planned', 'in_progress', 'completed', 'cancelled']) status?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() notes?: string;
}
