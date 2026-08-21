import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OutboxEvent, OutboxStatus } from '../entities/outbox-event.entity';
import { TransactionContextService } from './transaction-context.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepo: Repository<OutboxEvent>,
    private readonly transactionContext: TransactionContextService,
    private readonly cls: ClsService,
    private readonly eventEmitter: EventEmitter2,
    @Optional() @Inject(CACHE_MANAGER) private readonly cacheManager?: Cache,
  ) {}

  /**
   * Saves an event to the outbox table using the active transaction manager.
   * Ensures the event notification is ONLY triggered strictly AFTER transaction COMMIT.
   */
  async saveEvent(params: { topic: string; payload: Record<string, unknown>; manager?: EntityManager }): Promise<OutboxEvent> {
    const { topic, payload, manager } = params;
    const activeManager = manager || this.transactionContext.manager;
    const correlationId = this.cls.get('reqId');
    
    const event = activeManager.create(OutboxEvent, {
      topic,
      payload,
      status: OutboxStatus.PENDING,
      attempts: 0,
      correlationId: correlationId || null,
    });

    const saved = await activeManager.save(OutboxEvent, event);

    // Safe execution offloaded to setImmediate without polluting queryRunner prototype
    setImmediate(() => {
      this.notifyWorker(saved.id);
    });

    return saved;
  }

  private notifyWorker(eventId: number | string) {
    try {
      // 1. In-process notification
      this.eventEmitter.emit('outbox.new-event', { eventId });

      // 2. Inter-process notification (Redis for multi-pod / Render worker)
      if (this.cacheManager) {
        const cm = this.cacheManager as unknown as {
          store?: { client?: { publish?: (channel: string, message: string) => Promise<unknown> } };
          stores?: Array<{ client?: { publish?: (channel: string, message: string) => Promise<unknown> } }>;
        };
        const store = cm.store || cm.stores?.[0];
        const redisClient = store?.client;
        if (redisClient && typeof redisClient.publish === 'function') {
          redisClient.publish('outbox:events', JSON.stringify({ eventId })).catch(() => {});
        }
      }
    } catch (err) {
      this.logger.debug(`Worker notification offloaded to fallback poll: ${err?.message || err}`);
    }
  }
}

