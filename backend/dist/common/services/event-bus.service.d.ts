import { Observable } from 'rxjs';
export interface InternalEvent {
    type: string;
    payload: any;
    metadata?: any;
}
export declare class InternalEventBus {
    private readonly logger;
    private readonly bus$;
    emit(type: string, payload: any, metadata?: any): void;
    on<T = any>(type: string): Observable<T>;
    all(): Observable<InternalEvent>;
}
