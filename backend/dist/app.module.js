"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const throttler_proxy_guard_1 = require("./common/guards/throttler-proxy.guard");
const cache_manager_1 = require("@nestjs/cache-manager");
const nestjs_cls_1 = require("nestjs-cls");
const transactional_1 = require("@nestjs-cls/transactional");
const transactional_adapter_typeorm_1 = require("@nestjs-cls/transactional-adapter-typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const cache_manager_redis_yet_1 = require("cache-manager-redis-yet");
const nestjs_pino_1 = require("nestjs-pino");
const uuid_1 = require("uuid");
const telemetry_module_1 = require("./modules/telemetry/telemetry.module");
const rabbitmq_module_1 = require("./common/services/rabbitmq.module");
const database_config_1 = __importDefault(require("./config/database.config"));
const jwt_config_1 = __importDefault(require("./config/jwt.config"));
const redis_config_1 = __importDefault(require("./config/redis.config"));
const rabbitmq_config_1 = __importDefault(require("./config/rabbitmq.config"));
const storage_config_1 = __importDefault(require("./config/storage.config"));
const config_schema_1 = require("./config/config.schema");
const audit_interceptor_1 = require("./common/interceptors/audit.interceptor");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const permissions_guard_1 = require("./common/guards/permissions.guard");
const audit_subscriber_1 = require("./common/subscribers/audit.subscriber");
const common_module_1 = require("./common/common.module");
const storage_module_1 = require("./common/services/storage/storage.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const roles_module_1 = require("./modules/roles/roles.module");
const departments_module_1 = require("./modules/departments/departments.module");
const parties_module_1 = require("./modules/parties/parties.module");
const inventory_module_1 = require("./modules/inventory/inventory.module");
const sales_module_1 = require("./modules/sales/sales.module");
const finance_module_1 = require("./modules/finance/finance.module");
const production_module_1 = require("./modules/production/production.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const settings_module_1 = require("./modules/settings/settings.module");
const logs_module_1 = require("./modules/logs/logs.module");
const notes_module_1 = require("./modules/notes/notes.module");
const webhooks_module_1 = require("./modules/webhooks/webhooks.module");
const staff_module_1 = require("./modules/staff/staff.module");
const health_module_1 = require("./infrastructure/health/health.module");
let AppModule = class AppModule {
    configure(consumer) {
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
            event_emitter_1.EventEmitterModule.forRoot(),
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [database_config_1.default, jwt_config_1.default, redis_config_1.default, rabbitmq_config_1.default, storage_config_1.default],
                validationSchema: config_schema_1.configValidationSchema,
                envFilePath: '.env'
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({ ...configService.get('database') }),
            }),
            nestjs_cls_1.ClsModule.forRoot({
                global: true,
                middleware: { mount: true },
                plugins: [
                    new transactional_1.ClsPluginTransactional({
                        imports: [typeorm_1.TypeOrmModule],
                        adapter: new transactional_adapter_typeorm_1.TransactionalAdapterTypeOrm({
                            dataSourceToken: (0, typeorm_2.getDataSourceToken)(),
                        }),
                    }),
                ],
            }),
            nestjs_pino_1.LoggerModule.forRootAsync({
                imports: [nestjs_cls_1.ClsModule],
                inject: [nestjs_cls_1.ClsService],
                useFactory: (cls) => ({
                    pinoHttp: {
                        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
                        redact: {
                            paths: ['req.headers.authorization', 'req.body.password', 'req.body.secret', 'req.body.token', 'req.body.creditCard', 'req.body.iban', 'req.body.cvv'],
                            censor: '********',
                        },
                        genReqId: (req) => {
                            const reqId = req.headers['x-request-id'] || (0, uuid_1.v4)();
                            cls.set('reqId', reqId);
                            return reqId;
                        },
                        transport: process.env.NODE_ENV !== 'production' ? {
                            target: 'pino-pretty',
                            options: { singleLine: true }
                        } : undefined,
                    },
                }),
            }),
            cache_manager_1.CacheModule.registerAsync({
                isGlobal: true,
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (config) => ({
                    store: cache_manager_redis_yet_1.redisStore,
                    host: config.get('redis.host'),
                    port: config.get('redis.port'),
                    password: config.get('redis.password'),
                    ttl: config.get('redis.ttl'),
                }),
            }),
            rabbitmq_module_1.RabbitMQModule,
            telemetry_module_1.TelemetryModule, auth_module_1.AuthModule, users_module_1.UsersModule, roles_module_1.RolesModule, departments_module_1.DepartmentsModule, parties_module_1.PartiesModule, inventory_module_1.InventoryModule,
            sales_module_1.SalesModule, finance_module_1.FinanceModule, production_module_1.ProductionModule, dashboard_module_1.DashboardModule, settings_module_1.SettingsModule,
            logs_module_1.LogsModule, notes_module_1.NotesModule, webhooks_module_1.WebhooksModule, staff_module_1.StaffModule, common_module_1.CommonModule, health_module_1.HealthModule, storage_module_1.StorageModule,
        ],
        providers: [
            { provide: core_1.APP_INTERCEPTOR, useClass: audit_interceptor_1.AuditInterceptor },
            { provide: core_1.APP_GUARD, useClass: throttler_proxy_guard_1.ThrottlerProxyGuard },
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: permissions_guard_1.PermissionsGuard },
            audit_subscriber_1.AuditSubscriber,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map