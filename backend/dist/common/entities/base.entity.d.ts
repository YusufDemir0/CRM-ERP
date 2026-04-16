import { RecordState } from '../enums/record-state.enum';
export declare abstract class BaseEntity {
    id: number;
    state: RecordState;
    createdBy: number | null;
    createdAt: Date;
    updatedBy: number | null;
    updatedAt: Date;
    deletedAt: Date | null;
}
