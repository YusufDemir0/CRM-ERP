export declare class SystemLog {
    id: string;
    userId?: string | null;
    username?: string | null;
    fullName?: string | null;
    action: string;
    module?: string | null;
    tag: string;
    details?: string | null;
    ipAddress?: string | null;
    createdAt: Date;
    isDeleted: boolean;
}
