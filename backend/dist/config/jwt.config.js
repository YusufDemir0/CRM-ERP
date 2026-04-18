"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('jwt', () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('FATAL: JWT_SECRET environment variable is not set in production. Shutting down.');
        }
        console.warn('[WARNING] JWT_SECRET not set. Using dev-only fallback. NEVER use this in production.');
    }
    return {
        secret: secret || 'dev-only-secret-do-not-use-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    };
});
//# sourceMappingURL=jwt.config.js.map