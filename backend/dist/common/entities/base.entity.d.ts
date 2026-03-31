export declare abstract class BaseEntity {
    id: number;
    state: number;
    createdBy: number | null;
    createdAt: Date;
    updatedBy: number | null;
    updatedAt: Date;
    deletedAt: Date | null;
}
