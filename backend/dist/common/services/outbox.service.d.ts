import { Repository, EntityManager } from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OutboxEvent } from '../entities/outbox-event.entity';
import { TransactionContextService } from './transaction-context.service';
export declare class OutboxService {
    private readonly outboxRepo;
    private readonly transactionContext;
    private readonly cls;
    private readonly eventEmitter;
    private readonly logger;
    constructor(outboxRepo: Repository<OutboxEvent>, transactionContext: TransactionContextService, cls: ClsService, eventEmitter: EventEmitter2);
    saveEvent(params: {
        topic: string;
        payload: Record<string, unknown>;
        manager?: EntityManager;
    }): Promise<OutboxEvent>;
}
