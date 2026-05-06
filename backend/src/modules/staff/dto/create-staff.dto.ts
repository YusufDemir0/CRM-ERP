import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsDateString, MaxLength, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  lastName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsDateString()
  @IsOptional()
  entryDate?: string;

  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(11)
  tckn?: string;
}
