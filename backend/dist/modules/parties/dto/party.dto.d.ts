export declare class CreatePartyDto {
    type: 'customer' | 'provider';
    name: string;
    phone1?: string;
    phone2?: string;
    taxOffice?: string;
    taxNumber?: string;
    email?: string;
    address?: string;
    cityId?: string;
    districtName?: string;
    creditLimit?: number;
    paymentTerms?: string;
    currencyId?: string;
    notes?: string;
    departmentId?: string;
    maturityDays?: number;
}
export declare class UpdatePartyDto {
    type?: 'customer' | 'provider';
    name?: string;
    phone1?: string;
    phone2?: string;
    taxOffice?: string;
    taxNumber?: string;
    email?: string;
    address?: string;
    cityId?: string;
    districtName?: string;
    creditLimit?: number;
    paymentTerms?: string;
    currencyId?: string;
    notes?: string;
    departmentId?: string;
    maturityDays?: number;
    state?: number;
}
import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class PartiesQueryDto extends PaginationDto {
    type?: string;
    state?: number;
    departmentId?: string;
    isMovements?: string;
}
export declare class MovementsQueryDto extends PaginationDto {
    partyId?: string;
}
export interface StatementEntry {
    id: string;
    date: string;
    createdAt: Date | string;
    type: string;
    code: string;
    description: string;
    debit: number;
    credit: number;
    balance?: number;
    transactionId?: string;
}
export interface MovementRow {
    id: string;
    date: string;
    partyName: string | undefined;
    partyType: string | undefined;
    partyId: string;
    source: string;
    description: string;
    debit: number;
    credit: number;
    currency: string;
    transactionId?: string;
}
