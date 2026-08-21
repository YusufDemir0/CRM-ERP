import { registerAs } from '@nestjs/config';
import * as fs from 'fs';

/**
 * Database Configuration — Enterprise Ready
 * 
 * Supports:
 *   - SSL/TLS connections with CA cert (for managed databases like Aiven MySQL, AWS RDS)
 *   - Configurable connection pool (differentiated for API and Worker)
 *   - Read replica routing
 *   - Environment-based logging levels
 */
export default registerAs('database', () => {
  const sslEnabled = process.env.DB_SSL_ENABLED === 'true';
  const isWorker = process.env.IS_WORKER === 'true';
  const defaultPool = isWorker ? '10' : '30';
  const poolSize = parseInt(process.env.DB_POOL_SIZE || defaultPool, 10);

  const sslConfig = sslEnabled
    ? {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        ca: process.env.DB_CA_CERT_PATH
          ? fs.readFileSync(process.env.DB_CA_CERT_PATH).toString()
          : process.env.DB_CA_CERT || undefined,
      }
    : undefined;

  const baseConfig = {
    type: 'mysql' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'benyaptim',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false,
    migrationsRun: process.env.MIGRATIONS_RUN === 'true',
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    charset: 'utf8mb4_unicode_ci',
    timezone: '+00:00',
    extra: {
      connectionLimit: poolSize,
      // Connection recovery
      connectTimeout: 10000,
      // Keep-alive for long-running connections (managed DB firewall)
      enableKeepAlive: true,
      keepAliveInitialDelay: 30000,
      ...(sslConfig ? { ssl: sslConfig } : {}),
    },
  };

  // Read replica configuration (activate when DB_READ_HOST is set)
  const readHost = process.env.DB_READ_HOST;
  if (readHost) {
    return {
      ...baseConfig,
      replication: {
        master: {
          host: baseConfig.host,
          port: baseConfig.port,
          username: baseConfig.username,
          password: baseConfig.password,
          database: baseConfig.database,
        },
        slaves: [
          {
            host: readHost,
            port: parseInt(process.env.DB_READ_PORT || process.env.DB_PORT || '3306', 10),
            username: process.env.DB_READ_USERNAME || baseConfig.username,
            password: process.env.DB_READ_PASSWORD || baseConfig.password,
            database: baseConfig.database,
          },
        ],
      },
    };
  }

  return baseConfig;
});
