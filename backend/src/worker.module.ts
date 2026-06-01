import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { TelemetryModule } from './modules/telemetry/telemetry.module';

// Config
import databaseConfig from './config/database.config';
import rabbitmqConfig from './config/rabbitmq.config';
import { configValidationSchema } from './config/config.schema';

// Worker Services
import { OutboxWorker } from './common/services/outbox.worker';
import { OutboxService } from './common/services/outbox.service';
import { TransactionContextService } from './common/services/transaction-context.service';
import { OutboxEvent } from './common/entities/outbox-event.entity';
import { RabbitMQModule } from './common/services/rabbitmq.module';

/**
 * WorkerModule — Background job processing module.
 * 
 * This module runs as a SEPARATE process from the API.
 * It handles:
 *   - Outbox event processing (CRON-based polling)
 *   - Scheduled maintenance tasks (cleanup, etc.)
 *   - Future: RabbitMQ consumer integration
 * 
 * It does NOT:
 *   - Listen for HTTP requests
 *   - Apply JWT/CSRF/Throttle guards
 *   - Serve any API endpoints
 */
@Module({
  imports: [
    // ── Config ────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, rabbitmqConfig],
      validationSchema: configValidationSchema,
      envFilePath: '.env',
    }),

    // ── Database ──────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({ ...configService.get('database') }),
    }),
    TypeOrmModule.forFeature([OutboxEvent]),
    RabbitMQModule,

    // ── CLS (Transaction Context) ─────────────────────────
    ClsModule.forRoot({
      global: true,
      middleware: { mount: false }, // No HTTP middleware needed in worker
      plugins: [
        new ClsPluginTransactional({
          imports: [TypeOrmModule],
          adapter: new TransactionalAdapterTypeOrm({
            dataSourceToken: getDataSourceToken(),
          }),
        }),
      ],
    }),

    // ── Scheduling ────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── Events ────────────────────────────────────────────
    EventEmitterModule.forRoot(),

    // ── Logging ───────────────────────────────────────────
    TelemetryModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        // SEC: Native C-based field redaction
        redact: {
          paths: ['req.headers.authorization', 'req.body.password', 'req.body.secret', 'req.body.token', 'req.body.creditCard', 'req.body.iban', 'req.body.cvv'],
          censor: '********',
        },
        transport: process.env.NODE_ENV !== 'production' ? {
          target: 'pino-pretty',
          options: { singleLine: true }
        } : undefined,
      },
    }),
  ],
  providers: [
    TransactionContextService,
    OutboxService,
    OutboxWorker,
  ],
})
export class WorkerModule {}
