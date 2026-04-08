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
}
export declare class UpdateProductionOrderDto {
    plannedQuantity?: number;
    producedQuantity?: number;
    wastageQuantity?: number;
    sourceDepartmentId?: number;
    targetDepartmentId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    notes?: string;
}
