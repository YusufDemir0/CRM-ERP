import { Global, Module, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { CacheService } from './services/cache.service';
import { InternalEventBus } from './services/event-bus.service';
import { TransactionContextService } from './services/transaction-context.service';
import { TransactionInternal } from './decorators/transactional.decorator';

@Global()
@Module({
  providers: [CacheService, InternalEventBus, TransactionContextService],
  exports: [CacheService, InternalEventBus, TransactionContextService],
})
export class CommonModule implements OnModuleInit {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cls: ClsService,
  ) { }

  onModuleInit() {
    // FE-11: Bridge TypeORM and CLS for @Transactional decorator
    TransactionInternal.dataSource = this.dataSource;
    TransactionInternal.cls = this.cls;
  }
}
