import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Decimal } from 'decimal.js';
export declare class CreateItemDto {
    name: string;
    itemTypeId: number;
    itemCodeGroupId: number;
    providerId?: number;
    criticalLimit?: Decimal;
    image?: string;
    purchasePrice?: Decimal;
    salePrice?: Decimal;
    netPrice?: Decimal;
    currencyId?: number;
    quantityTypeId: number;
    kdv?: Decimal;
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
    criticalLimit?: Decimal;
    image?: string;
    purchasePrice?: Decimal;
    salePrice?: Decimal;
    netPrice?: Decimal;
    currencyId?: number;
    quantityTypeId?: number;
    kdv?: Decimal;
    description?: string;
    notes?: string;
    state?: number;
}
export declare class CreateItemTypeDto {
    name: string;
    abbreviation: string;
}
export declare class UpdateItemTypeDto {
    name?: string;
    abbreviation?: string;
    state?: number;
}
export declare class CreateQuantityTypeDto {
    name: string;
    abbreviation: string;
}
export declare class UpdateQuantityTypeDto {
    name?: string;
    abbreviation?: string;
    state?: number;
}
export declare class CreateItemCodeGroupDto {
    name: string;
    prefix: string;
}
export declare class UpdateItemCodeGroupDto {
    name?: string;
    prefix?: string;
    state?: number;
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
    providerId?: number;
    currencyId?: number;
    state?: number;
    search?: string;
    critical?: string;
}
export declare class StocksQueryDto extends PaginationDto {
    departmentId?: number;
    itemId?: number;
    isCritical?: string;
}
