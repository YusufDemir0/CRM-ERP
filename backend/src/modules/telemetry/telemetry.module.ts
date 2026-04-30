import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetricsService } from './metrics.service';
import { OutboxEvent } from '../../common/entities/outbox-event.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([OutboxEvent])],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class TelemetryModule {}
