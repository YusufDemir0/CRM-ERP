import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Bypass safe methods
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(request.method)) {
      return true;
    }

    // Bypass login, register, and webhooks
    if (
      request.path.startsWith('/api/auth/login') ||
      request.path.startsWith('/api/auth/register') ||
      request.path.startsWith('/api/auth/logout') ||
      request.path.startsWith('/api/webhooks')
    ) {
      return true;
    }

    const csrfCookie = request.cookies['XSRF-TOKEN'];
    const csrfHeader = request.headers['x-xsrf-token'];

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      throw new ForbiddenException('CSRF doğrulaması başarısız.');
    }

    return true;
  }
}
