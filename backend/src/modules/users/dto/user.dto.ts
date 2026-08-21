import { IsOptional, IsString, IsNumber, IsEmail, MinLength, IsInt, IsIn, Matches, IsArray, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır' })
  password: string;

  @IsString()
  fullName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  phone: string;

  @IsString()
  departmentId: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'En az bir rol seçilmelidir' })
  roleIds: string[];
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır' })
  password?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString() departmentId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];

  @IsOptional()
  @IsNumber()
  @IsInt()
  @IsIn([0, 1])
  @Type(() => Number)
  state?: number;
}