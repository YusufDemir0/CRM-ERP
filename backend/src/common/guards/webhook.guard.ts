import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * SEC-03: Webhook Security (HMAC Signature Validation)
 * Third-party services (Payment, Logistics, etc.) should send an HMAC signature.
 * This guard validates that the request body matches the signature using a shared secret.
 */
@Injectable()
export class WebhookGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-hub-signature-256'] || request.headers['x-signature'];
    
    if (!signature) {
      throw new UnauthorizedException('WEBHOOK_SIGNATURE_MISSING');
    }

    const secret = this.configService.get<string>('WEBHOOK_SECRET') || 'default-webhook-secret';
    
    // SEC-03: Use rawBody for accurate signature validation
    const rawBody = request.rawBody;
    if (!rawBody) {
      this.configService.get<string>('NODE_ENV') !== 'production' && console.warn('WebhookGuard: rawBody is missing. Ensure NestFactory.create({ rawBody: true }) is set.');
    }
    const body = rawBody || JSON.stringify(request.body);
    
    // Verify HMAC SHA256
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(body).digest('hex');

    if (signature !== digest && signature !== hmac.update(body).digest('hex')) {
      throw new UnauthorizedException('WEBHOOK_SIGNATURE_INVALID');
    }

    return true;
  }
}
