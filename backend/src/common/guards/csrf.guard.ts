import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class CsrfGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // GET, HEAD, OPTIONS isteklerini muaf tut
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }

    // Double Submit Cookie Kontrolü
    // Cookie'deki 'XSRF-TOKEN' ile Header'daki 'x-xsrf-token' eşleşmeli
    const csrfCookie = request.cookies['XSRF-TOKEN'];
    const csrfHeader = request.headers['x-xsrf-token'];

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      throw new ForbiddenException('Geçersiz veya eksik CSRF token.');
    }

    return true;
  }
}
