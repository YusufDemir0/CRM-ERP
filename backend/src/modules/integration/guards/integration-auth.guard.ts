import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ServiceUnavailableException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import * as crypto from 'crypto';

/**
 * ErmayWeb ↔ ERP paylaşılan anahtar doğrulaması.
 * Anahtar yapılandırılmamışsa kapalı başarısız olur (varsayılan/sabit anahtar YOK).
 */
@Injectable()
export class IntegrationAuthGuard implements CanActivate {
  private readonly logger = new Logger(IntegrationAuthGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const configuredKey = this.configService.get<string>('INTEGRATION_KEY');
    if (!configuredKey) {
      this.logger.error('INTEGRATION_KEY is not configured; integration endpoints are disabled');
      throw new ServiceUnavailableException('INTEGRATION_NOT_CONFIGURED');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers['x-integration-key'];
    const providedKey = typeof header === 'string' ? header : undefined;
    if (!providedKey) {
      throw new UnauthorizedException('INTEGRATION_KEY_MISSING');
    }

    const keyA = crypto.createHash('sha256').update(providedKey).digest();
    const keyB = crypto.createHash('sha256').update(configuredKey).digest();
    if (!crypto.timingSafeEqual(keyA, keyB)) {
      throw new UnauthorizedException('INTEGRATION_KEY_INVALID');
    }

    return true;
  }
}
