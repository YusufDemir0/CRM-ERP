import { ValidationPipe, ClassSerializerInterceptor, Logger } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  const logger = new Logger('Bootstrap');

  // Global prefix
  app.setGlobalPrefix('api');

  // SEC-01: Security Headers (X-Content-Type-Options, X-Frame-Options, HSTS, CSP)
  // Install: npm install helmet
  app.use(helmet());
  logger.log('✅ Helmet security headers enabled');

  // PERF-01: Response Compression (gzip)
  // Install: npm install compression @types/compression
  app.use(compression());
  logger.log('✅ Response compression enabled');

  // SEC-02: Trust Proxy — Reverse proxy (Nginx/Cloudflare) arkasında gerçek IP algılama
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Cookie Parser
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5143',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    exposedHeaders: ['X-CSRF-TOKEN'], // SEC-03: Allow frontend to see the CSRF token
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        // SEC-04: Disable implicit conversion to enforce explicit @Type() decorators.
        enableImplicitConversion: false,
      },
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // SEC-03: Double Submit Cookie CSRF Protection
  // Modern replacement for deprecated 'csurf' middleware. 
  // Works via CsrfInterceptor (sets cookie) and CsrfGuard (validates header).
  // Registered as APP_GUARD and APP_INTERCEPTOR in AppModule.

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.APP_PORT || 5143;
  await app.listen(port);
  logger.log(`🚀 ERP Backend running on http://localhost:${port}/api`);
}
bootstrap();
