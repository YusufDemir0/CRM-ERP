import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * SEC-03: CSRF Seeding Middleware
 * Ensures every response (even those blocked by Guards) carries a CSRF token.
 * Middleware runs BEFORE Guards, so this is the reliable way to seed the token.
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    let token = req.cookies['XSRF-TOKEN'];

    if (!token) {
      // SEC-03: Stable CSRF token per session/browser instance
      token = uuidv4();
      res.cookie('XSRF-TOKEN', token, {
        httpOnly: false, // Required for frontend to read and send back in headers
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours stability
      });
    }

    // Always provide the token in header for the frontend to sync/refresh its state if needed
    res.setHeader('X-CSRF-TOKEN', token);
    
    next();
  }
}
