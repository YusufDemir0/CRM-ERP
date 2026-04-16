import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { RecordState } from '../../../common/enums/record-state.enum';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface JwtPayload {
  sub: number;
  username: string;
  departmentId: number | null;
  tokenVersion: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
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
      secretOrKey: configService.get<string>('jwt.secret') || 'erp-super-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    const cacheKey = `user_state_${payload.sub}`;
    let userState = await this.cacheManager.get<{ state: RecordState, tokenVersion: number }>(cacheKey);

    if (!userState) {
      const user = await this.dataSource.getRepository(User).findOne({
        where: { id: payload.sub },
        select: ['id', 'state', 'tokenVersion']
      });
      
      if (!user) {
        throw new UnauthorizedException('Kullanıcı bulunamadı.');
      }

      userState = { state: user.state, tokenVersion: user.tokenVersion };
      await this.cacheManager.set(cacheKey, userState, 60000); // Cache for 60 seconds
    }

    if (userState.state !== RecordState.ACTIVE) {
      await this.cacheManager.del(cacheKey);
      throw new UnauthorizedException('Kullanıcı hesabı pasif.');
    }

    if (userState.tokenVersion !== payload.tokenVersion) {
      await this.cacheManager.del(cacheKey);
      throw new UnauthorizedException('Oturum sonlandırılmış veya geçersiz.');
    }

    return {
      id: payload.sub,
      sub: payload.sub,
      username: payload.username,
      departmentId: payload.departmentId,
    };
  }
}
