import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OutboxEvent } from '../entities/outbox-event.entity';
import { RabbitMQService } from './rabbitmq.service';
export declare class OutboxWorker implements OnModuleInit {
    private readonly outboxRepo;
    private readonly rabbitmq;
    private readonly eventEmitter;
    private readonly logger;
    private isProcessing;
    private processingPromise;
    private static readonly STALE_TIMEOUT_MS;
    constructor(outboxRepo: Repository<OutboxEvent>, rabbitmq: RabbitMQService, eventEmitter: EventEmitter2);
    onModuleInit(): void;
    onNewEvent(): Promise<void>;
    heartbeatPoll(): Promise<void>;
    handleOutbox(): Promise<void>;
    recoverStaleEvents(): Promise<void>;
    cleanupOutbox(): Promise<void>;
}
