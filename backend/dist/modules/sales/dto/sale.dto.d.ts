import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class CreateSaleItemDto {
    itemId: number;
    quantity: string;
    price: string;
    discountAmount?: string;
    discountPercent?: string;
    kdvRate?: string;
    description?: string;
}
export declare class CreateSaleDto {
    partyId: number;
    saleTypeId: number;
    currencyId?: number;
    deliveryDate?: string;
    deposit?: string;
    discountAmount?: string;
    discountPercent?: string;
    notes?: string;
    items: CreateSaleItemDto[];
}
export declare class UpdateSaleDto {
    partyId?: number;
    currencyId?: number;
    deliveryDate?: string;
    deposit?: string;
    discountAmount?: string;
    discountPercent?: string;
    notes?: string;
    items?: CreateSaleItemDto[];
}
export declare class CreateSaleTypeDto {
    name: string;
    abbreviation: string;
}
export declare class ApproveSaleDto {
    departmentId: number;
    commercialAccountId?: number;
}
export declare class SalesQueryDto extends PaginationDto {
    status?: string;
    partyId?: number;
}
export declare class ShipSaleDto {
    items?: {
        itemId: number;
        quantity: number;
    }[];
}
