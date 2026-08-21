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

  // Cross-origin istekler için Helmet politikası
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );

  app.use(compression());
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.use(cookieParser());

  // 🔥 TÜM VERCEL VE LOCAL DOMAINLERI KUSURSUZ KABUL EDEN CORS
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Gelen origin'i dinamik olarak onayla (Credentials ile tam uyumlu)
      callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-CSRF-TOKEN',
      'Cookie',
    ],
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

  app.enableShutdownHooks();

  const port = process.env.PORT || configService.get<number>('APP_PORT') || 5143;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 ERP Backend API running on port ${port}`);
}
bootstrap();

