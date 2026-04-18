export declare class AuditLog {
    id: number;
    entityName: string;
    entityId: number | null;
    action: 'insert' | 'update' | 'delete';
    oldValues: string | null;
    newValues: string | null;
    userId: number | null;
    ipAddress: string | null;
    createdAt: Date;
}
