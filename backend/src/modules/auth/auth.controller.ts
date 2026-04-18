import { Controller, Post, Body, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, ForgotPasswordDto, ChangePasswordDto } from './dto/auth.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
  @Public()
  @Get('csrf')
  async getCsrf() {
    return { success: true };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // SEC-05: Login throttle = hesap kilitleme limiti (5)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, user } = await this.authService.login(dto);

    res.cookie('erp_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // SEC-02: Changed from 'strict' for better dev port compatibility
      maxAge: 8 * 60 * 60 * 1000, 
    });

    return { 
      message: 'Giriş başarılı',
      user 
    };
  }

  @Public()
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('erp_token');
    return { message: 'Çıkış başarılı' };
  }

  // SEC-06: Register endpoint artık Public DEĞİL.
  // Sadece 'users.create' yetkisine sahip kullanıcılar (admin) kullanıcı oluşturabilir.
  @RequirePermissions('users.create')
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    await this.authService.register(dto);
    return { message: 'Kayıt başarılı' };
  }

  @Get('profile')
  async getProfile(@CurrentUser('sub') userId: number) {
    return this.authService.getProfile(userId);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 5 dakikada 3 deneme
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @Post('change-password')
  async changePassword(@CurrentUser('sub') userId: number, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto);
  }
}
