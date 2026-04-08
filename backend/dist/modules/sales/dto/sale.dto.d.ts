import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class CreateSaleItemDto {
    itemId: number;
    quantity: number;
    price: number;
    discountAmount?: number;
    discountPercent?: number;
    kdvRate?: number;
    description?: string;
}
export declare class CreateSaleDto {
    partyId: number;
    saleTypeId: number;
    currencyId?: number;
    deliveryDate?: string;
    deposit?: number;
    discountAmount?: number;
    discountPercent?: number;
    notes?: string;
    items: CreateSaleItemDto[];
}
export declare class UpdateSaleDto {
    partyId?: number;
    currencyId?: number;
    deliveryDate?: string;
    deposit?: number;
    discountAmount?: number;
    discountPercent?: number;
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
