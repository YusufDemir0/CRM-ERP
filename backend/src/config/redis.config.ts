import { registerAs } from '@nestjs/config';

/**
 * Redis Configuration — Enterprise Ready
 * 
 * Supports:
 *   - REDIS_URL (Upstash rediss:// format with TLS)
 *   - Host, port, password fallback
 *   - Key prefix for multi-tenant isolation
 *   - Configurable TTL
 */
export default registerAs('redis', () => ({
  url: process.env.REDIS_URL || undefined,
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,

  // Multi-tenant key prefix: prevents cache collision across tenants
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'ermay:',

  // Default TTL in milliseconds (60 seconds)
  ttl: parseInt(process.env.REDIS_DEFAULT_TTL || '60000', 10),

  // Connection retry strategy
  retryDelayMs: 1000,
  maxRetries: 10,
}));
