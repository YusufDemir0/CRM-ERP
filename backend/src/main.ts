import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Cookie Parser
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5143', // Backend self-reference if needed
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        // SEC-04: Disable implicit conversion to enforce explicit @Type() decorators.
        // This prevents unexpected string-to-number coercions that can leak bugs.
        enableImplicitConversion: false,
      },
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Global guards
  const { CsrfGuard } = require('./common/guards/csrf.guard');
  app.useGlobalGuards(new CsrfGuard());

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.APP_PORT || 5143;
  await app.listen(port);
  console.log(`🚀 ERP Backend running on http://localhost:${port}/api`);
}
bootstrap();
