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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MetricsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const api_1 = require("@opentelemetry/api");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const outbox_event_entity_1 = require("../../common/entities/outbox-event.entity");
let MetricsService = MetricsService_1 = class MetricsService {
    constructor(outboxRepo) {
        this.outboxRepo = outboxRepo;
        this.logger = new common_1.Logger(MetricsService_1.name);
    }
    onModuleInit() {
        const meter = api_1.metrics.getMeter('ermay-business-metrics');
        this.outboxGauge = meter.createObservableGauge('ermay_outbox_pending_events', {
            description: 'Number of pending events in the outbox queue',
            unit: 'events',
        });
        this.outboxGauge.addCallback(async (observableResult) => {
            try {
                const count = await this.outboxRepo.count({
                    where: { status: outbox_event_entity_1.OutboxStatus.PENDING },
                });
                observableResult.observe(count);
            }
            catch (error) {
                this.logger.error(`Failed to record outbox depth metric: ${error.message}`);
            }
        });
        this.logger.log('✅ Custom business metrics (Outbox Gauge) initialized');
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = MetricsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(outbox_event_entity_1.OutboxEvent)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], MetricsService);
//# sourceMappingURL=metrics.service.js.map