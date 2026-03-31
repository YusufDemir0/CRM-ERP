export declare class TransactionSequence {
    id: number;
    prefix: string;
    currentNumber: number;
    createdBy: number | null;
    createdAt: Date;
    updatedBy: number | null;
    updatedAt: Date;
    deletedAt: Date | null;
    state: number;
}
