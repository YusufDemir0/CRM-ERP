import { Decimal } from 'decimal.js';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Bom } from './bom.entity';
import { Department } from '../../departments/entities/department.entity';
export declare class ProductionOrder extends BaseEntity {
    code: string;
    bomId: string;
    sourceDepartmentId: string | null;
    targetDepartmentId: string | null;
    plannedQuantity: Decimal;
    producedQuantity: Decimal;
    wastageQuantity: Decimal;
    status: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
    unitCost: Decimal;
    totalCost: Decimal;
    laborCost: Decimal;
    overheadCost: Decimal;
    startDate: string | null;
    endDate: string | null;
    notes: string | null;
    bom: Bom;
    sourceDepartment: Department;
    targetDepartment: Department;
}
