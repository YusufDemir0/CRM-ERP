"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const nestjs_cls_1 = require("nestjs-cls");
const cache_service_1 = require("./services/cache.service");
const event_bus_service_1 = require("./services/event-bus.service");
const transaction_context_service_1 = require("./services/transaction-context.service");
const transactional_decorator_1 = require("./decorators/transactional.decorator");
let CommonModule = class CommonModule {
    constructor(dataSource, cls) {
        this.dataSource = dataSource;
        this.cls = cls;
    }
    onModuleInit() {
        transactional_decorator_1.TransactionInternal.dataSource = this.dataSource;
        transactional_decorator_1.TransactionInternal.cls = this.cls;
    }
};
exports.CommonModule = CommonModule;
exports.CommonModule = CommonModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [cache_service_1.CacheService, event_bus_service_1.InternalEventBus, transaction_context_service_1.TransactionContextService],
        exports: [cache_service_1.CacheService, event_bus_service_1.InternalEventBus, transaction_context_service_1.TransactionContextService],
    }),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        nestjs_cls_1.ClsService])
], CommonModule);
//# sourceMappingURL=common.module.js.map