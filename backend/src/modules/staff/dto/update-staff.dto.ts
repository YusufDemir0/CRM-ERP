import { IsString, IsOptional, IsBoolean, IsDateString, MaxLength, IsInt, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStaffDto {
  @IsOptional() @IsString() @MaxLength(20) firstName?: string;
  @IsOptional() @IsString() @MaxLength(20) lastName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsDateString() entryDate?: string;
  @IsOptional() @IsNumber() @IsInt() @Type(() => Number) departmentId?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
