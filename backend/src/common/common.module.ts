import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheService } from './services/cache.service';
import { TransactionContextService } from './services/transaction-context.service';
import { SequenceGeneratorService } from './services/sequence-generator.service';
import { OutboxService } from './services/outbox.service';
import { OutboxEvent } from './entities/outbox-event.entity';
import { RabbitMQModule } from './services/rabbitmq.module';
import { StorageModule } from './services/storage/storage.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([OutboxEvent]),
    RabbitMQModule,
    StorageModule,
  ],
  providers: [
    CacheService,
    TransactionContextService,
    SequenceGeneratorService,
    OutboxService,
    // OutboxWorker removed — runs in worker process only
  ],
  exports: [
    CacheService,
    TransactionContextService,
    SequenceGeneratorService,
    OutboxService,
    TypeOrmModule,
  ],
})
export class CommonModule { }

