import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * SEC-03: Webhook Security (HMAC Signature Validation)
 * Third-party services (Payment, Logistics, etc.) should send an HMAC signature.
 * This guard validates that the request body matches the signature using a shared secret.
 */
@Injectable()
export class WebhookGuard implements CanActivate {
  constructor(private configService: ConfigService) { }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-hub-signature-256'] || request.headers['x-signature'];

    if (!signature) {
      throw new UnauthorizedException('WEBHOOK_SIGNATURE_MISSING');
    }

    const secret = this.configService.get<string>('WEBHOOK_SECRET');
    if (!secret) {
      throw new UnauthorizedException('WEBHOOK_SECRET is not configured. Webhook verification is disabled for safety.');
    }

    const rawBody = request.rawBody;
    if (!rawBody) {
      throw new BadRequestException('WEBHOOK_RAW_BODY_MISSING');
    }
    const body = rawBody;

    // Verify HMAC SHA256
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(body).digest('hex');
    const digestWithPrefix = 'sha256=' + digest;

    // SEC-03: Use timingSafeEqual to prevent timing attacks.
    const signatureStr = signature.toString();
    const isSha256Match = this.safeCompare(signatureStr, digestWithPrefix) || this.safeCompare(signatureStr, digest);

    if (!isSha256Match) {
      throw new UnauthorizedException('WEBHOOK_SIGNATURE_INVALID');
    }

    return true;
  }

  /**
   * SEC-03: Constant-time string comparison via HMAC hashing.
   * 
   * Instead of short-circuiting on length mismatch (which leaks timing info),
   * both inputs are hashed to fixed-length digests before comparison.
   * This eliminates the length-extension timing leak entirely.
   */
  private safeCompare(a: string, b: string): boolean {
    const hashA = crypto.createHash('sha256').update(a).digest();
    const hashB = crypto.createHash('sha256').update(b).digest();
    return crypto.timingSafeEqual(hashA, hashB);
  }

}
