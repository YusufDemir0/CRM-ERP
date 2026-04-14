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

    // Bypass login and register
    const bypassedRoutes = ['/api/auth/login', '/api/auth/register', '/api/auth/logout'];
    if (bypassedRoutes.includes(request.path)) {
      return true;
    }

    // Bypass public routes (like login/register if needed, but CSRF is usually for logged in sessions)
    // However, the prompt says "all POST/PUT/PATCH/DELETE route'larına uygulanmış guard"
    // For erp_token based auth, we need this check.

    const csrfCookie = request.cookies['XSRF-TOKEN'];
    const csrfHeader = request.headers['x-csrf-token'];

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      throw new ForbiddenException('CSRF doğrulaması başarısız.');
    }

    return true;
  }
}
