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
    plannedQuantity: string | number;
    sourceDepartmentId?: number;
    targetDepartmentId?: number;
    startDate?: string;
    endDate?: string;
    notes?: string;
}
export declare class UpdateProductionOrderDto {
    plannedQuantity?: string | number;
    producedQuantity?: string | number;
    wastageQuantity?: string | number;
    sourceDepartmentId?: number;
    targetDepartmentId?: number;
    status?: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
    laborCost?: string | number;
    overheadCost?: string | number;
    startDate?: string;
    endDate?: string;
    notes?: string;
}
