import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { RecordState } from '../../../common/enums/record-state.enum';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

export interface JwtPayload {
  sub: number;
  username: string;
  departmentId: string | null;
  tokenVersion: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    configService: ConfigService,
    private dataSource: DataSource,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        if (req && req.cookies) {
          return req.cookies['erp_token'] ?? null;
        }
        return null;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret')!,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Geçersiz token yapısı.');
    }

    const userId = String(payload.sub);
    const stateCacheKey = `user_state_${userId}`;
    let userState = await this.cacheManager.get<{ state: number; tokenVersion: number }>(stateCacheKey);

    if (!userState) {
      const userRepo = this.dataSource.getRepository(User);
      const dbUser = await userRepo.findOne({
        where: { id: userId },
        select: ['id', 'state', 'tokenVersion'],
      });

      if (!dbUser) {
        throw new UnauthorizedException('Kullanıcı bulunamadı veya silinmiş.');
      }

      userState = { state: dbUser.state, tokenVersion: dbUser.tokenVersion };
      await this.cacheManager.set(stateCacheKey, userState, 30000); // 30s cache
    }

    if (userState.state !== RecordState.ACTIVE) {
      throw new UnauthorizedException('Hesabınız aktif değil veya engellenmiştir.');
    }

    if (payload.tokenVersion !== undefined && userState.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Oturumunuz geçersiz kılınmıştır. Lütfen tekrar giriş yapın.');
    }

    return {
      id: payload.sub,
      sub: payload.sub,
      username: payload.username,
      departmentId: payload.departmentId,
      tokenVersion: payload.tokenVersion,
    };
  }
}
