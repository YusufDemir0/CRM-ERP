import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';
import { RecordState } from '../../../common/enums/record-state.enum';

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
    private dataSource: DataSource
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
    const user = await this.dataSource.getRepository(User).findOne({
      where: { id: payload.sub },
      select: ['id', 'state', 'tokenVersion']
    });

    if (!user || user.state !== RecordState.ACTIVE) {
      throw new UnauthorizedException('Kullanıcı hesabı pasif veya bulunamadı.');
    }

    if (user.tokenVersion !== payload.tokenVersion) {
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
