import { RecordState } from '../enums/record-state.enum';
export declare abstract class BaseEntity {
    id: string;
    state: RecordState;
    createdBy: string | null;
    createdAt: Date;
    updatedBy: string | null;
    updatedAt: Date;
    deletedAt: Date | null;
}
