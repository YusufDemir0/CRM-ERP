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
    state?: number;
}
import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class PartiesQueryDto extends PaginationDto {
    type?: string;
    state?: number;
    departmentId?: string;
}
