import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class BomQueryDto extends PaginationDto {
}
export declare class ProductionOrderQueryDto extends PaginationDto {
    status?: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
}
export declare class CreateBomItemDto {
    itemId: number;
    quantity: number;
    description?: string;
}
export declare class CreateBomDto {
    name: string;
    targetItemId?: number;
    description?: string;
    items: CreateBomItemDto[];
}
export declare class UpdateBomDto {
    name?: string;
    targetItemId?: number;
    description?: string;
    state?: number;
    items?: CreateBomItemDto[];
}
export declare class CreateProductionOrderDto {
    bomId: number;
    plannedQuantity: number;
    sourceDepartmentId?: number;
    targetDepartmentId?: number;
    startDate?: string;
    endDate?: string;
    notes?: string;
    status?: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
    producedQuantity?: number;
    wastageQuantity?: number;
    laborCost?: number;
    overheadCost?: number;
}
export declare class UpdateProductionOrderDto {
    bomId?: number;
    plannedQuantity?: number;
    producedQuantity?: number;
    wastageQuantity?: number;
    sourceDepartmentId?: number;
    targetDepartmentId?: number;
    status?: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
    laborCost?: number;
    overheadCost?: number;
    startDate?: string;
    endDate?: string;
    notes?: string;
}
