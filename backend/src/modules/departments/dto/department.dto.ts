import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  abbreviation?: string;

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Type(() => Number)
  departmentTypeId?: number;

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Type(() => Number)
  commercialAccountId?: number;
}

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  abbreviation?: string;

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Type(() => Number)
  departmentTypeId?: number;

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Type(() => Number)
  commercialAccountId?: number;

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Type(() => Number)
  state?: number;
}

export class CreateDepartmentTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  abbreviation: string;
}

export class UpdateDepartmentTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  abbreviation?: string;

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Type(() => Number)
  state?: number;
}

export class DepartmentsQueryDto extends PaginationDto {
  @IsOptional()
  @IsNumber()
  @IsInt()
  @Type(() => Number)
  departmentTypeId?: number;

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Type(() => Number)
  commercialAccountId?: number;

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Type(() => Number)
  state?: number;

  @IsOptional()
  @IsString()
  search?: string;
}
