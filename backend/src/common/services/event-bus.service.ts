import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface InternalEvent {
  type: string;
  payload: any;
  metadata?: any;
}

@Injectable()
export class InternalEventBus {
  private readonly logger = new Logger(InternalEventBus.name);
  private readonly bus$ = new Subject<InternalEvent>();
  private readonly handlers = new Map<string, Array<(payload: any) => Promise<void>>>();

  /**
   * Emit an event to the bus. If it's a critical domain event, use emitSync.
   */
  emit(type: string, payload: any, metadata?: any) {
    this.logger.debug(`Event emitted (Async): ${type}`);
    this.bus$.next({ type, payload, metadata });
  }

  /**
   * Emit an event and AWAIT all registered handlers.
   * Useful for transactional integrity across modules.
   */
  async emitSync(type: string, payload: any, metadata?: any): Promise<void> {
    this.logger.debug(`Event emitted (Sync): ${type}`);
    
    // Still push to the async bus for logging or multi-casting trackers
    this.bus$.next({ type, payload, metadata });

    const typeHandlers = this.handlers.get(type);
    if (typeHandlers && typeHandlers.length > 0) {
      // Execute all handlers in parallel and wait for them
      await Promise.all(typeHandlers.map(handler => handler(payload)));
    }
  }

  /**
   * Register a synchronous handler that will be awaited by emitSync
   */
  subscribeSync(type: string, handler: (payload: any) => Promise<void>) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
  }

  /**
   * Subscribe to a specific event type (Async RxJS)
   */
  on<T = any>(type: string): Observable<T> {
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
