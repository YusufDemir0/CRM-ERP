import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class CreateItemDto {
    name: string;
    itemTypeId: number;
    itemCodeGroupId: number;
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
    itemTypeId?: number;
    itemCodeGroupId?: number;
    code?: string;
    code1?: string;
    code2?: string;
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
export declare class CreateItemCodeGroupDto {
    name: string;
    prefix: string;
}
export declare class StockAdjustmentDto {
    itemId: number;
    departmentId: number;
    quantity: number;
    type: 'in' | 'out';
    description?: string;
    notes?: string;
}
export declare class TransferStockDto {
    itemId: number;
    fromDepartmentId: number;
    toDepartmentId: number;
    quantity: number;
    description?: string;
}
export declare class ItemsQueryDto extends PaginationDto {
    itemTypeId?: number;
}
export declare class StocksQueryDto extends PaginationDto {
    departmentId?: number;
    itemId?: number;
}
