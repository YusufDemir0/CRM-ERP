import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { OutboxEvent } from '../../common/entities/outbox-event.entity';
export declare class MetricsService implements OnModuleInit {
    private readonly outboxRepo;
    private readonly logger;
    private outboxGauge;
    constructor(outboxRepo: Repository<OutboxEvent>);
    onModuleInit(): void;
}
