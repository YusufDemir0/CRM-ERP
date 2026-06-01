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
exports.configValidationSchema = void 0;
const Joi = __importStar(require("joi"));
exports.configValidationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    APP_PORT: Joi.number().default(5143),
    ALLOWED_ORIGINS: Joi.string().default('http://localhost:5173,http://127.0.0.1:5173'),
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().default(3306),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().allow('').default(''),
    DB_DATABASE: Joi.string().required(),
    DB_SSL_ENABLED: Joi.boolean().default(false),
    DB_POOL_SIZE: Joi.number().default(50),
    DB_LOGGING_ENABLED: Joi.boolean().default(true),
    JWT_SECRET: Joi.string().required().messages({
        'any.required': 'JWT_SECRET is critical for security and must be provided.',
    }),
    JWT_EXPIRES_IN: Joi.string().default('24h'),
    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().default(6379),
    REDIS_PASSWORD: Joi.string().allow('').default(''),
    RABBITMQ_URL: Joi.string().optional(),
    RABBITMQ_USER: Joi.string().default('erp_user'),
    RABBITMQ_PASS: Joi.string().default('changeme'),
    STORAGE_PROVIDER: Joi.string().valid('local', 's3').default('local'),
    MYSQL_ROOT_PASSWORD: Joi.string().optional(),
});
//# sourceMappingURL=config.schema.js.map