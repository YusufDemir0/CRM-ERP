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
const database_config_1 = __importDefault(require("./config/database.config"));
const jwt_config_1 = __importDefault(require("./config/jwt.config"));
const audit_interceptor_1 = require("./common/interceptors/audit.interceptor");
const logs_interceptor_1 = require("./common/interceptors/logs.interceptor");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const permissions_guard_1 = require("./common/guards/permissions.guard");
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
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 120,
                }]),
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [database_config_1.default, jwt_config_1.default],
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    ...configService.get('database'),
                }),
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            departments_module_1.DepartmentsModule,
            parties_module_1.PartiesModule,
            inventory_module_1.InventoryModule,
            sales_module_1.SalesModule,
            finance_module_1.FinanceModule,
            production_module_1.ProductionModule,
            dashboard_module_1.DashboardModule,
            settings_module_1.SettingsModule,
            logs_module_1.LogsModule,
            notes_module_1.NotesModule,
        ],
        providers: [
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: audit_interceptor_1.AuditInterceptor,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: logs_interceptor_1.LogsInterceptor,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: permissions_guard_1.PermissionsGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map