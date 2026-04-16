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

  /**
   * Emit an event to the bus
   */
  emit(type: string, payload: any, metadata?: any) {
    this.logger.debug(`Event emitted: ${type}`);
    this.bus$.next({ type, payload, metadata });
  }

  /**
   * Subscribe to a specific event type
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
