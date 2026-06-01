import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Decimal } from 'decimal.js';
export declare class CreateItemDto {
    name: string;
    itemTypeId: string;
    itemCodeGroupId: string;
    providerId: string;
    criticalLimit?: Decimal;
    image?: string;
    purchasePrice?: Decimal;
    salePrice?: Decimal;
    netPrice?: Decimal;
    currencyId: string;
    quantityTypeId: string;
    kdv?: Decimal;
    description?: string;
    notes?: string;
}
export declare class UpdateItemDto {
    name?: string;
    itemTypeId: string;
    itemCodeGroupId: string;
    code?: string;
    code1?: string;
    code2?: string;
    providerId: string;
    criticalLimit?: Decimal;
    image?: string;
    purchasePrice?: Decimal;
    salePrice?: Decimal;
    netPrice?: Decimal;
    currencyId: string;
    quantityTypeId: string;
    kdv?: Decimal;
    description?: string;
    notes?: string;
    state?: number;
}
export declare class ImportItemDto {
    code?: string;
    codeGroup?: string;
    codeSequence?: string;
    name: string;
    typeName?: string;
    unitName?: string;
    purchasePrice?: number;
    salePrice?: number;
    criticalLimit?: number;
    kdv?: number;
    currencyCode?: string;
    description?: string;
}
export declare class CreateItemTypeDto {
    name: string;
    abbreviation: string;
    isExcludedFromBom?: boolean;
}
export declare class UpdateItemTypeDto {
    name?: string;
    abbreviation?: string;
    state?: number;
    isExcludedFromBom?: boolean;
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
    itemId: string;
    departmentId: string;
    quantity: number;
    type: 'in' | 'out';
    unitCost?: number;
    description?: string;
    notes?: string;
}
export declare class TransferStockDto {
    itemId: string;
    fromDepartmentId: string;
    toDepartmentId: string;
    quantity: number;
    description?: string;
}
export declare class ItemsQueryDto extends PaginationDto {
    itemTypeId: string;
    providerId: string;
    currencyId: string;
    critical?: string;
}
export declare class StocksQueryDto extends PaginationDto {
    departmentId: string;
    itemId: string;
    isCritical?: string;
}
