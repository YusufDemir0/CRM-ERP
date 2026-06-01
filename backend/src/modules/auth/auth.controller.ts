import { Controller, Post, Body, Get, Res, Req } from '@nestjs/common';
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
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // SEC-05: Login throttle = hesap kilitleme limiti (5)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: import('express').Request,
  ) {
    const rawIp = req.ip || req.headers['x-forwarded-for'];
    const ipAddress = Array.isArray(rawIp) ? rawIp[0] : (rawIp || undefined);
    const { access_token, refresh_token, user } = await this.authService.login(dto, ipAddress);

    res.cookie('erp_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('erp_refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth/refresh', // only sent to refresh endpoint!
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { 
      message: 'Giriş başarılı',
      user 
    };
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: import('express').Request, @Res({ passthrough: true }) res: Response) {
    const oldRefreshToken = req.cookies['erp_refresh_token'];
    
    const { access_token, refresh_token } = await this.authService.refreshToken(oldRefreshToken);

    res.cookie('erp_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('erp_refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { message: 'Token refreshed' };
  }

  @Public()
  @Post('logout')
  async logout(@Req() req: import('express').Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies['erp_token'];
    if (token) {
      try {
        const payload = this.authService.decodeToken(token);
        if (payload && payload.sub) {
          const rawIp = req.ip || req.headers['x-forwarded-for'];
          const ipAddress = Array.isArray(rawIp) ? rawIp[0] : (rawIp || undefined);
          await this.authService.logout(
            String(payload.sub),
            payload.username,
            payload.fullName,
            ipAddress,
          );
        }
      } catch (e) {
        // Ignore errors decoding token on logout
      }
    }

    res.clearCookie('erp_token');
    res.clearCookie('erp_refresh_token', { path: '/api/auth/refresh' });
    return { message: 'Çıkış başarılı' };
  }

  // SEC-06: Register endpoint artık Public DEĞİL.
  // Sadece 'USER_CREATE' yetkisine sahip kullanıcılar (admin) kullanıcı oluşturabilir.
  @RequirePermissions('USER_CREATE')
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    await this.authService.register(dto);
    return { message: 'Kayıt başarılı' };
  }

  @Get('profile')
  async getProfile(@CurrentUser('sub') userId: string) {
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
  async changePassword(@CurrentUser('sub') userId: string, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto);
  }
}
