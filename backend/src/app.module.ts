import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// Config
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

// Common
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { PermissionsGuard } from './common/guards/permissions.guard';

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

@Module({
  imports: [
    // Global Config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig],
      envFilePath: '.env',
    }),

    // TypeORM — Mevcut MySQL veritabanına bağlan
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
      }),
    }),

    // Domain Modules
    AuthModule,
    UsersModule,
    RolesModule,
    DepartmentsModule,
    PartiesModule,
    InventoryModule,
    SalesModule,
    FinanceModule,
    ProductionModule,
  ],
  providers: [
    // Global Audit Interceptor — tüm request'lerde çalışır
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    // Global RBAC Guard — @RequirePermissions ile korunan endpoint'lerde çalışır
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
