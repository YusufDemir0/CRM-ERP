import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class CreateSaleItemDto {
    itemId: string;
    quantity: string;
    price: string;
    discountAmount?: string;
    discountPercent?: string;
    kdvRate?: string;
    description?: string;
}
export declare class CreateSaleDto {
    partyId: string;
    saleTypeId: string;
    currencyId: string;
    staffId: string;
    deliveryDate?: string;
    deposit?: string;
    discountAmount?: string;
    discountPercent?: string;
    representativePrice?: string;
    notes?: string;
    phone?: string;
    address?: string;
    taxNumber?: string;
    email?: string;
    source?: string;
    city?: string;
    district?: string;
    commercialAccountId?: string;
    maturityDays?: number;
    paymentType?: string;
    installments?: number;
    items: CreateSaleItemDto[];
}
export declare class UpdateSaleDto {
    partyId: string;
    currencyId: string;
    staffId: string;
    saleTypeId?: string;
    deliveryDate?: string;
    deposit?: string;
    discountAmount?: string;
    discountPercent?: string;
    representativePrice?: string;
    notes?: string;
    phone?: string;
    address?: string;
    taxNumber?: string;
    email?: string;
    source?: string;
    city?: string;
    district?: string;
    commercialAccountId?: string;
    maturityDays?: number;
    paymentType?: string;
    installments?: number;
    items?: CreateSaleItemDto[];
}
export declare class CreateSaleTypeDto {
    name: string;
    abbreviation: string;
}
export declare class ApproveSaleDto {
    departmentId: string;
    commercialAccountId?: string;
    items?: {
        itemId: string;
        departmentId: string;
        quantity: number;
    }[];
}
export declare class SalesQueryDto extends PaginationDto {
    status?: string;
    partyId?: string;
    ownSalesOnly?: string | boolean;
    departmentId?: string;
}
export declare class ShipSaleDto {
    items?: {
        itemId: string;
        quantity: string | number;
    }[];
    payments?: {
        commercialAccountId: string;
        amount: string | number;
    }[];
    vehicleIds?: string[];
    assignedStaffIds?: string[];
}
