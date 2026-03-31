export declare class CreateBomItemDto {
    itemId: number;
    quantity: number;
    description?: string;
}
export declare class CreateBomDto {
    name: string;
    description?: string;
    items: CreateBomItemDto[];
}
export declare class UpdateBomDto {
    name?: string;
    description?: string;
    state?: number;
}
export declare class CreateProductionOrderDto {
    bomId: number;
    plannedQuantity: number;
    startDate?: string;
    endDate?: string;
    notes?: string;
}
export declare class UpdateProductionOrderDto {
    producedQuantity?: number;
    wastageQuantity?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    notes?: string;
}
