export declare class CreatePartyDto {
    type: 'customer' | 'provider' | 'both';
    name: string;
    phone1?: string;
    phone2?: string;
    taxNumber?: string;
    email?: string;
    address?: string;
    creditLimit?: number;
    paymentTerms?: string;
    currencyId?: number;
    notes?: string;
}
export declare class UpdatePartyDto {
    type?: 'customer' | 'provider' | 'both';
    name?: string;
    phone1?: string;
    phone2?: string;
    taxNumber?: string;
    email?: string;
    address?: string;
    creditLimit?: number;
    paymentTerms?: string;
    currencyId?: number;
    notes?: string;
    state?: number;
}
import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class PartiesQueryDto extends PaginationDto {
    type?: string;
}
