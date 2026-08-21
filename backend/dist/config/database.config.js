"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
const fs = __importStar(require("fs"));
exports.default = (0, config_1.registerAs)('database', () => {
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
        type: 'mysql',
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
            connectTimeout: 10000,
            enableKeepAlive: true,
            keepAliveInitialDelay: 30000,
            ...(sslConfig ? { ssl: sslConfig } : {}),
        },
    };
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