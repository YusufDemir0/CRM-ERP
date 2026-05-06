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
    // STATELESS JWT: Do not hit Redis/DB on every request.
    // Token validity relies entirely on cryptographic signature and expiration.
    // Account ban/suspend checks are offloaded to the Refresh Token flow.
    return {
      id: payload.sub,
      sub: payload.sub,
      username: payload.username,
      departmentId: payload.departmentId,
      tokenVersion: payload.tokenVersion,
    };
  }
}
