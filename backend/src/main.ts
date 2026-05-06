import './telemetry';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bufferLogs: true, // Wait for Pino to be ready
  });
  
  // Use Pino for global logging
  const logger = app.get(Logger);
  app.useLogger(logger);
  
  const configService = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('api');

  // SEC-01: Security Headers
  app.use(helmet());
  logger.log('✅ Helmet security headers enabled');

  // PERF-01: Response Compression
  app.use(compression());
  logger.log('✅ Response compression enabled');

  // SEC-02: Trust Proxy
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Cookie Parser
  app.use(cookieParser());

  // CORS - Use ConfigService instead of process.env
  const allowedOriginsRaw = configService.get<string>('ALLOWED_ORIGINS');
  const allowedOrigins = allowedOriginsRaw 
    ? allowedOriginsRaw.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5143'];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    exposedHeaders: ['X-CSRF-TOKEN'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false, // ROAST FIX: Kapalı, artık tipler string olarak kalacak (BigInt vs)
      },
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // 🔥 ENTERPRISE: Graceful Shutdown — K8s SIGTERM handling
  app.enableShutdownHooks();
  logger.log('✅ Graceful shutdown hooks enabled');

  // Use ConfigService for Port
  const port = configService.get<number>('APP_PORT') || 5143;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 ERP Backend API running on http://0.0.0.0:${port}/api`);
  logger.log(`📊 Health check: http://localhost:${port}/api/health`);
}
bootstrap();

