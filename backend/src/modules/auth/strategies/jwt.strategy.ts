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
  departmentId: number | null;
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
    const cacheKey = `user_state_${payload.sub}`;
    let state = await this.cacheManager.get<number>(cacheKey);

    if (state === undefined || state === null) {
      const user = await this.dataSource.getRepository(User).findOne({
        where: { id: payload.sub },
        select: ['id', 'state']
      });

      if (!user) {
        throw new UnauthorizedException('Kullanıcı bulunamadı veya silinmiş');
      }

      state = user.state;
      // 5 dakika (300,000 ms) boyunca state bilgisini cache'de tut
      await this.cacheManager.set(cacheKey, state, 300000);
    }

    if (state !== RecordState.ACTIVE) {
      throw new UnauthorizedException('Kullanıcı hesabı askıya alınmış veya pasif durumda');
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
