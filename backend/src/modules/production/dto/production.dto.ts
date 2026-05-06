import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum, IsDateString, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class BomQueryDto extends PaginationDto {}

export class ProductionOrderQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(['draft', 'planned', 'in_progress', 'completed', 'cancelled'])
  status?: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
}

export class CreateBomItemDto {
  @IsString() itemId: string;
  @IsNumber() @Min(0.0001) @Type(() => Number) quantity: number;
  @IsOptional() @IsString() description?: string;
}

export class CreateBomDto {
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() targetItemId: string;
  @IsOptional() @IsString() description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBomItemDto)
  items: CreateBomItemDto[];
}

export class UpdateBomDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() targetItemId: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) state?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBomItemDto)
  items?: CreateBomItemDto[];
}

export class CreateProductionOrderDto {
  @IsString() bomId: string;
  @IsNumber() @Min(1) @Type(() => Number) plannedQuantity: number;
  @IsOptional() @IsString() sourceDepartmentId: string;
  @IsOptional() @IsString() targetDepartmentId: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsEnum(['draft', 'planned', 'in_progress', 'completed', 'cancelled']) status?: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
  @IsOptional() @IsNumber() @Type(() => Number) producedQuantity?: number;
  @IsOptional() @IsNumber() @Type(() => Number) wastageQuantity?: number;
  @IsOptional() @IsNumber() @Type(() => Number) laborCost?: number;
  @IsOptional() @IsNumber() @Type(() => Number) overheadCost?: number;
}

export class UpdateProductionOrderDto {
  @IsOptional() @IsString() bomId: string;
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number) plannedQuantity?: number;
  @IsOptional() @IsNumber() @Type(() => Number) producedQuantity?: number;
  @IsOptional() @IsNumber() @Type(() => Number) wastageQuantity?: number;
  @IsOptional() @IsString() sourceDepartmentId: string;
  @IsOptional() @IsString() targetDepartmentId: string;
  @IsOptional()
  @IsEnum(['draft', 'planned', 'in_progress', 'completed', 'cancelled']) 
  status?: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
  @IsOptional() @IsNumber() @Type(() => Number) laborCost?: number;
  @IsOptional() @IsNumber() @Type(() => Number) overheadCost?: number;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() notes?: string;
}