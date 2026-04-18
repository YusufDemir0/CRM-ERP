import { Observable } from 'rxjs';
export interface InternalEvent {
    type: string;
    payload: unknown;
    metadata?: unknown;
}
export declare class InternalEventBus {
    private readonly logger;
    private readonly bus$;
    private readonly handlers;
    emit(type: string, payload: unknown, metadata?: unknown): void;
    subscribeSync<T = unknown>(type: string, handler: (payload: T) => Promise<void>): void;
    emitSync(type: string, payload: unknown, metadata?: unknown): Promise<void>;
    on<T = unknown>(type: string): Observable<T>;
    all(): Observable<InternalEvent>;
}
