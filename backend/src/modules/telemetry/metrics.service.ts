import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { metrics, ObservableGauge, ObservableResult } from '@opentelemetry/api';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboxEvent, OutboxStatus } from '../../common/entities/outbox-event.entity';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly logger = new Logger(MetricsService.name);
  private outboxGauge: ObservableGauge;

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepo: Repository<OutboxEvent>,
  ) {}

  onModuleInit() {
    const meter = metrics.getMeter('ermay-business-metrics');

    // Create an observable gauge that Prometheus will scrape periodically
    this.outboxGauge = meter.createObservableGauge('ermay_outbox_pending_events', {
      description: 'Number of pending events in the outbox queue',
      unit: 'events',
    });

    this.outboxGauge.addCallback(async (observableResult: ObservableResult) => {
      try {
        const count = await this.outboxRepo.count({
          where: { status: OutboxStatus.PENDING },
        });
        observableResult.observe(count);
      } catch (error) {
        this.logger.error(`Failed to record outbox depth metric: ${error.message}`);
      }
    });

    this.logger.log('✅ Custom business metrics (Outbox Gauge) initialized');
  }
}
