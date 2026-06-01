export declare enum OutboxStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    PROCESSED = "processed",
    FAILED = "failed"
}
export declare class OutboxEvent {
    id: string;
    topic: string;
    payload: Record<string, unknown>;
    status: OutboxStatus;
    attempts: number;
    correlationId: string | null;
    error: string | null;
    createdAt: Date;
    processedAt: Date | null;
}
