"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('redis', () => ({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'ermay:',
    ttl: parseInt(process.env.REDIS_DEFAULT_TTL || '60000', 10),
    retryDelayMs: 1000,
    maxRetries: 10,
}));
//# sourceMappingURL=redis.config.js.map