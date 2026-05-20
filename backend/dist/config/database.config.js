"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('database', () => {
    const sslEnabled = process.env.DB_SSL_ENABLED === 'true';
    const poolSize = parseInt(process.env.DB_POOL_SIZE || '50', 10);
    const baseConfig = {
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'benyaptim',
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: process.env.NODE_ENV !== 'production',
        migrationsRun: false,
        migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
        logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        charset: 'utf8mb4',
        timezone: '+00:00',
        extra: {
            connectionLimit: poolSize,
            connectTimeout: 10000,
            enableKeepAlive: true,
            keepAliveInitialDelay: 30000,
        },
    };
    if (sslEnabled) {
        Object.assign(baseConfig.extra, {
            ssl: {
                rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
            },
        });
    }
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
//# sourceMappingURL=database.config.js.map