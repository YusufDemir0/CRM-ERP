import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerProxyGuard } from './common/guards/throttler-proxy.guard';
import { CacheModule } from '@nestjs/cache-manager';
import { ClsModule } from 'nestjs-cls';

// Config
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

// Common
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { LogsInterceptor } from './common/interceptors/logs.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { CsrfGuard } from './common/guards/csrf.guard';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { AuditSubscriber } from './common/subscribers/audit.subscriber';
import { CommonModule } from './common/common.module';

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

@Module({
  imports:[
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ClsModule.forRoot({ global: true, middleware: { mount: true } }),
    ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig, jwtConfig], envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({ ...configService.get('database') }),
    }),
    CacheModule.register({ isGlobal: true, ttl: 60000 }),
    AuthModule, UsersModule, RolesModule, DepartmentsModule, PartiesModule, InventoryModule,
    SalesModule, FinanceModule, ProductionModule, DashboardModule, SettingsModule,
    LogsModule, NotesModule, WebhooksModule, StaffModule, CommonModule,
  ],
  providers:[
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LogsInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerProxyGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    AuditSubscriber,
  ],
})
export class AppModule {

  configure(consumer: import('@nestjs/common').MiddlewareConsumer) {
    consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}