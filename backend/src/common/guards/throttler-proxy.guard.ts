import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable, ExecutionContext } from '@nestjs/common';

@Injectable()
export class ThrottlerProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    // Reverse proxy arkasında gerçek IP'yi al (X-Forwarded-For)
    // main.ts'de trust proxy set edildiği için req.ip zaten doğru gelmeli 
    // ama garanti olması için header kontrolü eklenebilir.
    const headers = req.headers as Record<string, string | string[] | undefined>;
    return (headers['x-forwarded-for'] as string) || (req.ip as string) || (req.connection as Record<string, unknown>)?.remoteAddress as string;
  }
}
