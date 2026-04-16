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
  constructor(
    private reflector: Reflector,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    // @Public() ile işaretlenmiş endpoint'ler için JWT doğrulaması atlat
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const activated = await super.canActivate(context);
    if (!activated) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user && user.sub) {
      // SEC-01: Session Revocation Check (tokenVersion)
      const cacheKey = `user_version_${user.sub}`;
      let dbVersion = await this.cacheManager.get<number>(cacheKey);

      if (dbVersion === undefined || dbVersion === null) {
        const dbUser = await this.userRepo.findOne({ where: { id: user.sub }, select: ['tokenVersion'] });
        dbVersion = dbUser?.tokenVersion || 0;
        await this.cacheManager.set(cacheKey, dbVersion, 300000); // 5 dk cache
      }

      if (user.tokenVersion !== dbVersion) {
         throw new UnauthorizedException('Oturumunuz sonlandırılmış. Lütfen tekrar giriş yapın.');
      }
    }

    return true;
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Geçersiz veya eksik token');
    }
    return user;
  }
}
