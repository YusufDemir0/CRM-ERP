import { IsString, IsNotEmpty, MinLength, IsNumber, IsInt, IsOptional, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Kullanıcı adı zorunludur' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Şifre zorunludur' })
  @MinLength(4, { message: 'Şifre en az 4 karakter olmalıdır' })
  password: string;
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Type(() => Number)
  departmentId?: number;
}
