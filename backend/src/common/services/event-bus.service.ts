import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface InternalEvent {
  type: string;
  payload: unknown;
  metadata?: unknown;
}

@Injectable()
export class InternalEventBus {
  private readonly logger = new Logger(InternalEventBus.name);
  private readonly bus$ = new Subject<InternalEvent>();
  private readonly handlers = new Map<string, Array<(payload: unknown) => Promise<void>>>();

  /**
   * Emit an event to the bus. If it's a critical domain event, use emitSync.
   */
  emit(type: string, payload: unknown, metadata?: unknown) {
    this.logger.debug(`Event emitted (Async): ${type}`);
    this.bus$.next({ type, payload, metadata });
  }


  /**
   * Subscribe to a specific event type (Synchronous)
   */
  subscribeSync<T = unknown>(type: string, handler: (payload: T) => Promise<void>) {
    const handlers = this.handlers.get(type) || [];
    handlers.push(handler as (payload: unknown) => Promise<void>);
    this.handlers.set(type, handlers);
  }

  /**
   * Emit an event synchronously. Awaits all handlers.
   */
  async emitSync(type: string, payload: unknown, metadata?: unknown): Promise<void> {
    this.logger.debug(`Event emitted (Sync): ${type}`);
    const handlers = this.handlers.get(type) || [];
    for (const handler of handlers) {
      await handler(payload);
    }
    this.bus$.next({ type, payload, metadata });
  }

  /**
   * Subscribe to a specific event type (Async RxJS)
   */
  on<T = unknown>(type: string): Observable<T> {
    return this.bus$.pipe(
      filter(event => event.type === type),
      map(event => event.payload as T)
    );
  }

  /**
   * Subscribe to all events
   */
  all(): Observable<InternalEvent> {
    return this.bus$.asObservable();
  }
}
