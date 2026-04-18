import { Injectable, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../modules/auth/entities/user.entity';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

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

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // @Public() ile işaretlenmiş endpoint'ler için JWT doğrulaması atlat
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // super.canActivate() returns boolean | Promise<boolean> | Observable<boolean>
    const result = await super.canActivate(context);
    return result as boolean;
  }

  handleRequest<TUser = unknown>(err: unknown, user: TUser, info: unknown): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Geçersiz veya eksik token');
    }
    return user;
  }
}
