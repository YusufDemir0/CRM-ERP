import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  // Base
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  APP_PORT: Joi.number().default(5143),
  ALLOWED_ORIGINS: Joi.string().default('http://localhost:5173,http://127.0.0.1:5173'),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').default(''),
  DB_DATABASE: Joi.string().required(),
  DB_SSL_ENABLED: Joi.boolean().default(false),
  DB_POOL_SIZE: Joi.number().default(50),
  DB_LOGGING_ENABLED: Joi.boolean().default(true),

  // JWT
  JWT_SECRET: Joi.string().required().messages({
    'any.required': 'JWT_SECRET is critical for security and must be provided.',
  }),
  JWT_EXPIRES_IN: Joi.string().default('24h'),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),

  // RabbitMQ (FAZ 2+)
  RABBITMQ_URL: Joi.string().optional(),
  RABBITMQ_USER: Joi.string().default('erp_user'),
  RABBITMQ_PASS: Joi.string().default('changeme'),

  // Storage (FAZ 2+)
  STORAGE_PROVIDER: Joi.string().valid('local', 's3').default('local'),

  // Docker Compose internals (not used by app, but validated to prevent startup errors)
  MYSQL_ROOT_PASSWORD: Joi.string().optional(),
});
