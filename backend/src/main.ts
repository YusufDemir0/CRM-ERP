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
    bufferLogs: true,
  });
  
  const logger = app.get(Logger);
  app.useLogger(logger);
  
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');

  // SEC-01: Security Headers (Cross-origin API uyumlu)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    }),
  );
  logger.log('✅ Helmet security headers enabled (cross-origin friendly)');

  // PERF-01: Response Compression
  app.use(compression());
  logger.log('✅ Response compression enabled');

  // SEC-02: Trust Proxy for Render / Cloud Load Balancers
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Cookie Parser
  app.use(cookieParser());

  // CORS - Tüm Vercel önizleme domainlerine, Render ve localhost'a otomatik izin ver
  const allowedOriginsRaw = configService.get<string>('ALLOWED_ORIGINS');
  const allowedOrigins = allowedOriginsRaw 
    ? allowedOriginsRaw.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5143'];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Postman, sunucu içi veya originsiz istekler
      if (!origin) return callback(null, true);

      const isAllowed = 
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*') ||
        /\.vercel\.app$/.test(origin) ||
        /\.onrender\.com$/.test(origin) ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1');

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-CSRF-TOKEN'],
    exposedHeaders: ['Set-Cookie', 'X-CSRF-TOKEN'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new AllExceptionsFilter());

  // Graceful Shutdown
  app.enableShutdownHooks();
  logger.log('✅ Graceful shutdown hooks enabled');

  // Render dinamik PORT'unu öncelikli al
  const port = process.env.PORT || configService.get<number>('APP_PORT') || 5143;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 ERP Backend API running on port ${port} (http://0.0.0.0:${port}/api)`);
  logger.log(`📊 Health check: http://0.0.0.0:${port}/api/health`);
}
bootstrap();

