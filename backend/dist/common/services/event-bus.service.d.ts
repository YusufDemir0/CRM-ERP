import { Observable } from 'rxjs';
export interface InternalEvent {
    type: string;
    payload: any;
    metadata?: any;
}
export declare class InternalEventBus {
    private readonly logger;
    private readonly bus$;
    private readonly handlers;
    emit(type: string, payload: any, metadata?: any): void;
    emitSync(type: string, payload: any, metadata?: any): Promise<void>;
    subscribeSync(type: string, handler: (payload: any) => Promise<void>): void;
    on<T = any>(type: string): Observable<T>;
    all(): Observable<InternalEvent>;
}
