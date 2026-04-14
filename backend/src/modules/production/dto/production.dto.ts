import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum, IsDateString, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class BomQueryDto extends PaginationDto {}

export class ProductionOrderQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(['draft', 'planned', 'in_progress', 'completed', 'cancelled'])
  status?: string;
}

export class CreateBomItemDto {
  @IsNumber() @IsInt() @Type(() => Number) itemId: number;
  @IsNumber() @Min(0.0001) @Type(() => Number) quantity: number;
  @IsOptional() @IsString() description?: string;
}

export class CreateBomDto {
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) targetItemId?: number;
  @IsOptional() @IsString() description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBomItemDto)
  items: CreateBomItemDto[];
}

export class UpdateBomDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) targetItemId?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) state?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBomItemDto)
  items?: CreateBomItemDto[];
}

export class CreateProductionOrderDto {
  @IsNumber() @IsInt() @Type(() => Number) bomId: number;
  @IsNumber() @Min(0.0001) @Type(() => Number) plannedQuantity: number;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) sourceDepartmentId?: number;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) targetDepartmentId?: number;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateProductionOrderDto {
  @IsOptional() @IsNumber() @Min(0.0001) plannedQuantity?: number;
  @IsOptional() @IsNumber() @Min(0) producedQuantity?: number;
  @IsOptional() @IsNumber() @Min(0) wastageQuantity?: number;
  @IsOptional() @IsNumber() sourceDepartmentId?: number;
  @IsOptional() @IsNumber() targetDepartmentId?: number;
  @IsOptional() @IsEnum(['draft', 'planned', 'in_progress', 'completed', 'cancelled']) status?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() notes?: string;
}