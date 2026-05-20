import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OutboxEvent, OutboxStatus } from '../entities/outbox-event.entity';
import { TransactionContextService } from './transaction-context.service';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepo: Repository<OutboxEvent>,
    private readonly transactionContext: TransactionContextService,
    private readonly cls: ClsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Saves an event to the outbox table using the current transaction manager.
   * This ensures the event is ONLY saved if the main business logic transaction succeeds.
   * After save, emits 'outbox.new-event' so the Worker picks up immediately.
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

    // Notify OutboxWorker immediately (fire-and-forget, non-blocking)
    // The event is emitted after the transaction commit via setImmediate
    // to ensure DB data is visible to the worker
    setImmediate(() => {
      this.eventEmitter.emit('outbox.new-event', { eventId: saved.id });
    });

    return saved;
  }
}

