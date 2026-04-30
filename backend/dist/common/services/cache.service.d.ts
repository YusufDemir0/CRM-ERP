import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
export declare class CacheService {
    private cacheManager;
    private readonly configService;
    private readonly logger;
    private readonly keyPrefix;
    constructor(cacheManager: Cache, configService: ConfigService);
    private prefixKey;
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    reset(): Promise<void>;
}
