import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

/**
 * CacheService — Redis-backed cache with graceful fallback.
 * 
 * Enterprise Features:
 *   - Key prefix for multi-tenant isolation
 *   - Graceful degradation: if Redis is down, returns null instead of crashing
 *   - Typed get/set operations
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly keyPrefix: string;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    this.keyPrefix = this.configService.get<string>('redis.keyPrefix') || 'ermay:';
  }

  private prefixKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.cacheManager.get<T>(this.prefixKey(key));
    } catch (error) {
      this.logger.warn(`Cache GET failed for key "${key}": ${error.message}`);
      return null; // Graceful fallback — don't crash, just miss cache
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(this.prefixKey(key), value, ttl);
    } catch (error) {
      this.logger.warn(`Cache SET failed for key "${key}": ${error.message}`);
      // Graceful fallback — don't crash, just skip caching
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(this.prefixKey(key));
    } catch (error) {
      this.logger.warn(`Cache DEL failed for key "${key}": ${error.message}`);
    }
  }

  async reset(): Promise<void> {
    try {
      await this.cacheManager.clear();
    } catch (error) {
      this.logger.warn(`Cache RESET failed: ${error.message}`);
    }
  }
}
