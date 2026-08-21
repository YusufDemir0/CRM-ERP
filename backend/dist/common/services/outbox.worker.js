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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var OutboxWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxWorker = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const outbox_event_entity_1 = require("../entities/outbox-event.entity");
const rabbitmq_service_1 = require("./rabbitmq.service");
const cache_manager_1 = require("@nestjs/cache-manager");
const dayjs_1 = __importDefault(require("dayjs"));
let OutboxWorker = OutboxWorker_1 = class OutboxWorker {
    constructor(outboxRepo, rabbitmq, eventEmitter, cacheManager) {
        this.outboxRepo = outboxRepo;
        this.rabbitmq = rabbitmq;
        this.eventEmitter = eventEmitter;
        this.cacheManager = cacheManager;
        this.logger = new common_1.Logger(OutboxWorker_1.name);
        this.isProcessing = false;
        this.processingPromise = null;
    }
    onModuleInit() {
        this.logger.log('OutboxWorker initialized — listening for outbox.new-event and Redis signals');
        try {
            if (this.cacheManager) {
                const cm = this.cacheManager;
                const store = cm.store || cm.stores?.[0];
                const redisClient = store?.client;
                if (redisClient && typeof redisClient.subscribe === 'function') {
                    redisClient.subscribe('outbox:events', () => {
                        this.onNewEvent().catch(() => { });
                    });
                }
            }
        }
        catch (e) {
            this.logger.debug(`Redis pub/sub subscription skipped: ${e?.message || e}`);
        }
    }
    async onNewEvent() {
        if (this.isProcessing)
            return;
        await this.handleOutbox();
    }
    async heartbeatPoll() {
        if (this.isProcessing)
            return;
        await this.handleOutbox();
    }
    async handleOutbox() {
        if (this.isProcessing)
            return;
        if (!this.rabbitmq.isConnected()) {
            this.logger.warn('RabbitMQ not connected. Skipping outbox poll.');
            return;
        }
        this.isProcessing = true;
        try {
            let claimedEvents = [];
            await this.outboxRepo.manager.transaction(async (manager) => {
                const pendingEvents = await manager.createQueryBuilder(outbox_event_entity_1.OutboxEvent, 'outbox')
                    .where('outbox.status = :status', { status: outbox_event_entity_1.OutboxStatus.PENDING })
                    .andWhere('outbox.attempts < 5')
                    .orderBy('outbox.createdAt', 'ASC')
                    .limit(50)
                    .setLock('pessimistic_write')
                    .setOnLocked('skip_locked')
                    .getMany();
                if (pendingEvents.length === 0)
                    return;
                const ids = pendingEvents.map(e => e.id);
                await manager.update(outbox_event_entity_1.OutboxEvent, { id: (0, typeorm_2.In)(ids) }, { status: outbox_event_entity_1.OutboxStatus.PROCESSING });
                claimedEvents = pendingEvents;
            });
            if (claimedEvents.length === 0)
                return;
            this.logger.log(`Processing ${claimedEvents.length} outbox events...`);
            for (const event of claimedEvents) {
                try {
                    const published = await this.rabbitmq.publish(event.topic, event.payload, event.correlationId || String(event.id));
                    if (published) {
                        await this.outboxRepo.update(event.id, {
                            status: outbox_event_entity_1.OutboxStatus.PROCESSED,
                            processedAt: new Date(),
                            error: null,
                        });
                        this.logger.debug(`Event ${event.id} published to RabbitMQ (topic: ${event.topic})`);
                    }
                    else {
                        const newAttempts = event.attempts + 1;
                        await this.outboxRepo.update(event.id, {
                            status: newAttempts >= 5 ? outbox_event_entity_1.OutboxStatus.FAILED : outbox_event_entity_1.OutboxStatus.PENDING,
                            attempts: newAttempts,
                            error: 'RabbitMQ publish NACK',
                        });
                        this.logger.warn(`Event ${event.id} NACK'd by RabbitMQ. Attempt ${newAttempts}/5`);
                    }
                }
                catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    this.logger.error(`Event ${event.id} processing error: ${errorMsg}`);
                    const newAttempts = event.attempts + 1;
                    await this.outboxRepo.update(event.id, {
                        status: newAttempts >= 5 ? outbox_event_entity_1.OutboxStatus.FAILED : outbox_event_entity_1.OutboxStatus.PENDING,
                        attempts: newAttempts,
                        error: errorMsg,
                    });
                }
            }
        }
        catch (error) {
            const stack = error instanceof Error ? error.stack : String(error);
            this.logger.error('Unhandled error in OutboxWorker', stack);
        }
        finally {
            this.isProcessing = false;
        }
    }
    async recoverStaleEvents() {
        const staleThreshold = new Date(Date.now() - OutboxWorker_1.STALE_TIMEOUT_MS);
        const result = await this.outboxRepo
            .createQueryBuilder()
            .update(outbox_event_entity_1.OutboxEvent)
            .set({ status: outbox_event_entity_1.OutboxStatus.PENDING })
            .where('status = :status', { status: outbox_event_entity_1.OutboxStatus.PROCESSING })
            .andWhere('(processedAt < :threshold OR (processedAt IS NULL AND createdAt < :threshold))', {
            threshold: staleThreshold,
        })
            .execute();
        if (result.affected && result.affected > 0) {
            this.logger.warn(`Recovered ${result.affected} stale PROCESSING events back to PENDING.`);
        }
    }
    async cleanupOutbox() {
        this.logger.log('Starting Outbox cleanup task...');
        const sevenDaysAgo = (0, dayjs_1.default)().subtract(7, 'days').toDate();
        const result = await this.outboxRepo.delete({
            status: outbox_event_entity_1.OutboxStatus.PROCESSED,
            processedAt: (0, typeorm_2.LessThan)(sevenDaysAgo)
        });
        this.logger.log(`Cleanup complete. Deleted ${result.affected} processed events.`);
    }
};
exports.OutboxWorker = OutboxWorker;
OutboxWorker.STALE_TIMEOUT_MS = 5 * 60 * 1000;
__decorate([
    (0, event_emitter_1.OnEvent)('outbox.new-event', { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OutboxWorker.prototype, "onNewEvent", null);
__decorate([
    (0, schedule_1.Cron)('*/60 * * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OutboxWorker.prototype, "heartbeatPoll", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OutboxWorker.prototype, "recoverStaleEvents", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OutboxWorker.prototype, "cleanupOutbox", null);
exports.OutboxWorker = OutboxWorker = OutboxWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(outbox_event_entity_1.OutboxEvent)),
    __param(3, (0, common_1.Optional)()),
    __param(3, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        rabbitmq_service_1.RabbitMQService,
        event_emitter_1.EventEmitter2, Object])
], OutboxWorker);
//# sourceMappingURL=outbox.worker.js.map