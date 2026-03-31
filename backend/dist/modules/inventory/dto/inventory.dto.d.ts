export declare class CreateItemDto {
    name: string;
    itemTypeId: number;
    providerId?: number;
    criticalLimit?: number;
    image?: string;
    purchasePrice?: number;
    salePrice?: number;
    netPrice?: number;
    currencyId?: number;
    quantityTypeId: number;
    kdv?: number;
    description?: string;
    notes?: string;
}
export declare class UpdateItemDto {
    name?: string;
    providerId?: number;
    criticalLimit?: number;
    image?: string;
    purchasePrice?: number;
    salePrice?: number;
    netPrice?: number;
    currencyId?: number;
    quantityTypeId?: number;
    kdv?: number;
    description?: string;
    notes?: string;
    state?: number;
}
export declare class CreateItemTypeDto {
    name: string;
    abbreviation: string;
}
export declare class CreateQuantityTypeDto {
    name: string;
    abbreviation: string;
}
export declare class StockAdjustmentDto {
    itemId: number;
    departmentId: number;
    quantity: number;
    type: 'in' | 'out';
    description?: string;
    notes?: string;
}
