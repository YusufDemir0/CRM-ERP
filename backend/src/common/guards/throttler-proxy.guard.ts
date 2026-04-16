import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable, ExecutionContext } from '@nestjs/common';

@Injectable()
export class ThrottlerProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Reverse proxy arkasında gerçek IP'yi al (X-Forwarded-For)
    // main.ts'de trust proxy set edildiği için req.ip zaten doğru gelmeli 
    // ama garanti olması için header kontrolü eklenebilir.
    return req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
  }
}
