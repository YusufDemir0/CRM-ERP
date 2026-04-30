import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

/**
 * SEC-03: CSRF Seeding Middleware
 * 
 * Uses cryptographically secure random bytes instead of UUID for token generation.
 * The token cookie is httpOnly: false so the frontend can read it and send it
 * back in the X-XSRF-TOKEN header (Double Submit Cookie pattern).
 * 
 * SECURITY NOTE: In a SameSite=Strict + HttpOnly JWT cookie architecture,
 * CSRF protection is largely redundant. However, since we use SameSite=Lax,
 * the Double Submit Cookie pattern adds an extra layer of defense.
 * The real CSRF defense is the cookie-header matching in CsrfGuard.
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    let token = req.cookies['XSRF-TOKEN'];

    if (!token) {
      // SEC-03: Use cryptographically secure random bytes instead of UUID
      token = crypto.randomBytes(32).toString('hex');
      res.cookie('XSRF-TOKEN', token, {
        httpOnly: false, // Required for frontend to read and send back in headers
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict', // Upgraded from 'lax' to 'strict' for tighter CSRF protection
        path: '/',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours stability
      });
    }

    // Always provide the token in header for the frontend to sync/refresh its state if needed
    res.setHeader('X-CSRF-TOKEN', token);
    
    next();
  }
}
