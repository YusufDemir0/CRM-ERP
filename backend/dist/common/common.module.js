"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const cache_service_1 = require("./services/cache.service");
const transaction_context_service_1 = require("./services/transaction-context.service");
const sequence_generator_service_1 = require("./services/sequence-generator.service");
const outbox_service_1 = require("./services/outbox.service");
const outbox_event_entity_1 = require("./entities/outbox-event.entity");
const rabbitmq_module_1 = require("./services/rabbitmq.module");
const storage_module_1 = require("./services/storage/storage.module");
let CommonModule = class CommonModule {
};
exports.CommonModule = CommonModule;
exports.CommonModule = CommonModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([outbox_event_entity_1.OutboxEvent]),
            rabbitmq_module_1.RabbitMQModule,
            storage_module_1.StorageModule,
        ],
        providers: [
            cache_service_1.CacheService,
            transaction_context_service_1.TransactionContextService,
            sequence_generator_service_1.SequenceGeneratorService,
            outbox_service_1.OutboxService,
        ],
        exports: [
            cache_service_1.CacheService,
            transaction_context_service_1.TransactionContextService,
            sequence_generator_service_1.SequenceGeneratorService,
            outbox_service_1.OutboxService,
            typeorm_1.TypeOrmModule,
        ],
    })
], CommonModule);
//# sourceMappingURL=common.module.js.map