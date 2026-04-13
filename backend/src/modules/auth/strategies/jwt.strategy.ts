import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export interface JwtPayload {
  sub: number;
  username: string;
  departmentId: number | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: (req: Request) => {
        let token = null;
        if (req && req.headers && req.headers.cookie) {
          // req.headers.cookie is a string like "name=value; name2=value2"
          const cookies = req.headers.cookie.split(';');
          const erpTokenCookie = cookies.find(c => c.trim().startsWith('erp_token='));
          if (erpTokenCookie) {
            token = erpTokenCookie.split('=')[1];
          }
        }
        return token;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'erp-super-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      sub: payload.sub,
      username: payload.username,
      departmentId: payload.departmentId,
    };
  }
}
