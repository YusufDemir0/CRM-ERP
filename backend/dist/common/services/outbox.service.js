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
var OutboxService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const nestjs_cls_1 = require("nestjs-cls");
const event_emitter_1 = require("@nestjs/event-emitter");
const outbox_event_entity_1 = require("../entities/outbox-event.entity");
const transaction_context_service_1 = require("./transaction-context.service");
const cache_manager_1 = require("@nestjs/cache-manager");
let OutboxService = OutboxService_1 = class OutboxService {
    constructor(outboxRepo, transactionContext, cls, eventEmitter, cacheManager) {
        this.outboxRepo = outboxRepo;
        this.transactionContext = transactionContext;
        this.cls = cls;
        this.eventEmitter = eventEmitter;
        this.cacheManager = cacheManager;
        this.logger = new common_1.Logger(OutboxService_1.name);
    }
    async saveEvent(params) {
        const { topic, payload, manager } = params;
        const activeManager = manager || this.transactionContext.manager;
        const correlationId = this.cls.get('reqId');
        const event = activeManager.create(outbox_event_entity_1.OutboxEvent, {
            topic,
            payload,
            status: outbox_event_entity_1.OutboxStatus.PENDING,
            attempts: 0,
            correlationId: correlationId || null,
        });
        const saved = await activeManager.save(outbox_event_entity_1.OutboxEvent, event);
        setImmediate(() => {
            this.notifyWorker(saved.id);
        });
        return saved;
    }
    notifyWorker(eventId) {
        try {
            this.eventEmitter.emit('outbox.new-event', { eventId });
            if (this.cacheManager) {
                const cm = this.cacheManager;
                const store = cm.store || cm.stores?.[0];
                const redisClient = store?.client;
                if (redisClient && typeof redisClient.publish === 'function') {
                    redisClient.publish('outbox:events', JSON.stringify({ eventId })).catch(() => { });
                }
            }
        }
        catch (err) {
            this.logger.debug(`Worker notification offloaded to fallback poll: ${err?.message || err}`);
        }
    }
};
exports.OutboxService = OutboxService;
exports.OutboxService = OutboxService = OutboxService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(outbox_event_entity_1.OutboxEvent)),
    __param(4, (0, common_1.Optional)()),
    __param(4, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        transaction_context_service_1.TransactionContextService,
        nestjs_cls_1.ClsService,
        event_emitter_1.EventEmitter2, Object])
], OutboxService);
//# sourceMappingURL=outbox.service.js.map