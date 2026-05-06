import { IsString, IsNotEmpty, MinLength, IsNumber, IsInt, IsOptional, IsEmail, Matches } from 'class-validator';
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
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
    message: 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir',
  })
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
  @IsString() departmentId: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Geçersiz email adresi' })
  @IsNotEmpty({ message: 'Email zorunludur' })
  email: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Mevcut şifre zorunludur' })
  currentPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Yeni şifre zorunludur' })
  @MinLength(8, { message: 'Yeni şifre en az 8 karakter olmalıdır' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
    message: 'Yeni şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir',
  })
  newPassword: string;
}
