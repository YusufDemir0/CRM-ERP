import { Global, Module } from '@nestjs/common';
import { CacheService } from './services/cache.service';
import { InternalEventBus } from './services/event-bus.service';

@Global()
@Module({
  providers: [CacheService, InternalEventBus],
  exports: [CacheService, InternalEventBus],
})
export class CommonModule {}
