import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt, ValidateIf, Length } from 'class-validator';
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
  @Length(3, 10, { message: 'Kısaltma en az 3, en fazla 10 karakter olmalıdır' })
  abbreviation?: string;

  @IsOptional()
  @IsString() departmentTypeId: string;

  @IsOptional()
  @IsString() commercialAccountId: string;

  @IsOptional()
  @IsString() cityId: string;
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
  @Length(3, 10, { message: 'Kısaltma en az 3, en fazla 10 karakter olmalıdır' })
  abbreviation?: string;

  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @IsString() departmentTypeId: string | null;

  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @IsString() commercialAccountId: string | null;

  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @IsString() cityId: string | null;

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
  @IsString() departmentTypeId: string;

  @IsOptional()
  @IsString() commercialAccountId: string;

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Type(() => Number)
  state?: number;

  @IsOptional()
  @IsString()
  search?: string;
}
