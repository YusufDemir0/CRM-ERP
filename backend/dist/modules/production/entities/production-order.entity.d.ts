import { BaseEntity } from '../../../common/entities/base.entity';
import { Bom } from './bom.entity';
export declare class ProductionOrder extends BaseEntity {
    code: string;
    bomId: number;
    plannedQuantity: number;
    producedQuantity: number;
    wastageQuantity: number;
    status: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
    startDate: string | null;
    endDate: string | null;
    notes: string | null;
    bom: Bom;
}
