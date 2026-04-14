import { Controller, Post, Body, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, user } = await this.authService.login(dto);

    // CSRF Token (Double Submit Cookie Pattern)
    const csrfToken = require('crypto').randomBytes(32).toString('hex');
    
    res.cookie('erp_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000, 
    });

    res.cookie('XSRF-TOKEN', csrfToken, {
      httpOnly: false, // Must be readable by JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
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

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    await this.authService.register(dto);
    return { message: 'Kayıt başarılı' };
  }

  @Get('profile')
  async getProfile(@CurrentUser('sub') userId: number) {
    return this.authService.getProfile(userId);
  }
}
