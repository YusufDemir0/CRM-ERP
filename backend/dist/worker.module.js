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
exports.WorkerModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const event_emitter_1 = require("@nestjs/event-emitter");
const nestjs_cls_1 = require("nestjs-cls");
const transactional_1 = require("@nestjs-cls/transactional");
const transactional_adapter_typeorm_1 = require("@nestjs-cls/transactional-adapter-typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const nestjs_pino_1 = require("nestjs-pino");
const telemetry_module_1 = require("./modules/telemetry/telemetry.module");
const database_config_1 = __importDefault(require("./config/database.config"));
const rabbitmq_config_1 = __importDefault(require("./config/rabbitmq.config"));
const config_schema_1 = require("./config/config.schema");
const outbox_worker_1 = require("./common/services/outbox.worker");
const outbox_service_1 = require("./common/services/outbox.service");
const transaction_context_service_1 = require("./common/services/transaction-context.service");
const outbox_event_entity_1 = require("./common/entities/outbox-event.entity");
const rabbitmq_module_1 = require("./common/services/rabbitmq.module");
let WorkerModule = class WorkerModule {
};
exports.WorkerModule = WorkerModule;
exports.WorkerModule = WorkerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [database_config_1.default, rabbitmq_config_1.default],
                validationSchema: config_schema_1.configValidationSchema,
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({ ...configService.get('database') }),
            }),
            typeorm_1.TypeOrmModule.forFeature([outbox_event_entity_1.OutboxEvent]),
            rabbitmq_module_1.RabbitMQModule,
            nestjs_cls_1.ClsModule.forRoot({
                global: true,
                middleware: { mount: false },
                plugins: [
                    new transactional_1.ClsPluginTransactional({
                        imports: [typeorm_1.TypeOrmModule],
                        adapter: new transactional_adapter_typeorm_1.TransactionalAdapterTypeOrm({
                            dataSourceToken: (0, typeorm_2.getDataSourceToken)(),
                        }),
                    }),
                ],
            }),
            schedule_1.ScheduleModule.forRoot(),
            event_emitter_1.EventEmitterModule.forRoot(),
            telemetry_module_1.TelemetryModule,
            nestjs_pino_1.LoggerModule.forRoot({
                pinoHttp: {
                    level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
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
            transaction_context_service_1.TransactionContextService,
            outbox_service_1.OutboxService,
            outbox_worker_1.OutboxWorker,
        ],
    })
], WorkerModule);
//# sourceMappingURL=worker.module.js.map