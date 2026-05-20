export declare class AuditLog {
    id: string;
    entityName: string;
    entityId: string | null;
    action: 'insert' | 'update' | 'delete';
    oldValues: string | null;
    newValues: string | null;
    userId: string | null;
    ipAddress: string | null;
    createdAt: Date;
}
