import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Global JWT Auth Guard:
 * - @Public() decorator'ı olan endpoint'ler bypass edilir (login, register)
 * - Diğer tüm endpoint'ler JWT token doğrulaması gerektirir
 * - Bu guard PermissionsGuard'dan ÖNCE çalışır, böylece request.user set edilir
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // @Public() ile işaretlenmiş endpoint'ler için JWT doğrulaması atlat
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Geçersiz veya eksik token');
    }
    return user;
  }
}
