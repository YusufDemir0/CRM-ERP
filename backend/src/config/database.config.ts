import { registerAs } from '@nestjs/config';

/**
 * Database Configuration — Enterprise Ready
 * 
 * Supports:
 *   - SSL/TLS connections (for managed databases like AWS RDS)
 *   - Configurable connection pool
 *   - Read replica routing (future)
 *   - Environment-based logging levels
 */
export default registerAs('database', () => {
  const sslEnabled = process.env.DB_SSL_ENABLED === 'true';
  const poolSize = parseInt(process.env.DB_POOL_SIZE || '50', 10);

  const baseConfig = {
    type: 'mysql' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'benyaptim',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: process.env.NODE_ENV !== 'production', // DEV-FIX: Yeni kolonların (department_id) eklenmesi için aktif edildi
    migrationsRun: true,
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    charset: 'utf8mb4',
    timezone: '+00:00',
    extra: {
      connectionLimit: poolSize,
      // Connection recovery
      connectTimeout: 10000,
      // Keep-alive for long-running connections (managed DB firewall)
      enableKeepAlive: true,
      keepAliveInitialDelay: 30000,
    },
  };

  // SSL/TLS for managed databases (AWS RDS, GCP Cloud SQL, etc.)
  if (sslEnabled) {
    Object.assign(baseConfig.extra, {
      ssl: {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      },
    });
  }

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
