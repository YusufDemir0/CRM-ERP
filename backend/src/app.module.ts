import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerProxyGuard } from './common/guards/throttler-proxy.guard';
import { CacheModule } from '@nestjs/cache-manager';
import { ClsModule, ClsService } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
// ScheduleModule moved to WorkerModule — CRON jobs run in worker process only
import { redisStore } from 'cache-manager-redis-yet';
import { LoggerModule } from 'nestjs-pino';
import { v4 as uuidv4 } from 'uuid';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { RabbitMQModule } from './common/services/rabbitmq.module';

// Config
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import rabbitmqConfig from './config/rabbitmq.config';
import storageConfig from './config/storage.config';
import { configValidationSchema } from './config/config.schema';

// Common
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
// LogsInterceptor REMOVED — Pino handles structured logging natively (see ADIM 1)
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AuditSubscriber } from './common/subscribers/audit.subscriber';

import { CommonModule } from './common/common.module';
import { StorageModule } from './common/services/storage/storage.module';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { PartiesModule } from './modules/parties/parties.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SalesModule } from './modules/sales/sales.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ProductionModule } from './modules/production/production.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SettingsModule } from './modules/settings/settings.module';
import { LogsModule } from './modules/logs/logs.module';
import { NotesModule } from './modules/notes/notes.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { StaffModule } from './modules/staff/staff.module';
import { HealthModule } from './infrastructure/health/health.module';

@Module({
  imports:[
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    EventEmitterModule.forRoot(),
    // ScheduleModule removed — runs in worker.ts process only
    ConfigModule.forRoot({ 
      isGlobal: true, 
      load: [databaseConfig, jwtConfig, redisConfig, rabbitmqConfig, storageConfig], 
      validationSchema: configValidationSchema,
      envFilePath: '.env' 
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({ ...configService.get('database') }),
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
      plugins: [
        new ClsPluginTransactional({
          imports: [TypeOrmModule],
          adapter: new TransactionalAdapterTypeOrm({
            dataSourceToken: getDataSourceToken(),
          }),
        }),
      ],
    }),
    // 🔥 ENTERPRISE: Structured JSON Logging + Correlation ID
    LoggerModule.forRootAsync({
      imports: [ClsModule],
      inject: [ClsService],
      useFactory: (cls: ClsService) => ({
        pinoHttp: {
          level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
          // SEC: Native C-based field redaction — eliminates need for JS-level sanitizeBody
          redact: {
            paths: ['req.headers.authorization', 'req.body.password', 'req.body.secret', 'req.body.token', 'req.body.creditCard', 'req.body.iban', 'req.body.cvv'],
            censor: '********',
          },
          genReqId: (req: import('http').IncomingMessage) => {
            const reqId = req.headers['x-request-id'] || uuidv4();
            // Store it in CLS context so services can access it without passing req down
            cls.set('reqId', reqId);
            return reqId;
          },
          transport: process.env.NODE_ENV !== 'production' ? {
            target: 'pino-pretty',
            options: { singleLine: true }
          } : undefined, // In production, we log pure JSON for Loki
        },
      }),
    }),
    // 🔥 ENTERPRISE: Redis cache with config from redis.config.ts (Supports Upstash rediss://)
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisUrl = config.get<string>('redis.url');
        if (redisUrl) {
          return {
            store: redisStore,
            url: redisUrl,
            ttl: config.get('redis.ttl', 60000),
          };
        }
        return {
          store: redisStore,
          host: config.get('redis.host'),
          port: config.get('redis.port'),
          password: config.get('redis.password'),
          ttl: config.get('redis.ttl', 60000),
        };
      },
    }),
    RabbitMQModule,
    TelemetryModule, AuthModule, UsersModule, RolesModule, DepartmentsModule, PartiesModule, InventoryModule,
    SalesModule, FinanceModule, ProductionModule, DashboardModule, SettingsModule,
    LogsModule, NotesModule, WebhooksModule, StaffModule, CommonModule, HealthModule, StorageModule,
  ],
  providers:[
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    // LogsInterceptor REMOVED — Self-DDoS risk eliminated (JSON.stringify on every request)
    { provide: APP_GUARD, useClass: ThrottlerProxyGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    AuditSubscriber,
  ],
})
export class AppModule {
  configure(consumer: import('@nestjs/common').MiddlewareConsumer) {
  }
}