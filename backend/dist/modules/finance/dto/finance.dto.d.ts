import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class CreateCurrencyDto {
    code: string;
    name: string;
    symbol: string;
    exchangeRate?: number;
    isDefault?: number;
}
export declare class UpdateCurrencyDto {
    name?: string;
    symbol?: string;
    exchangeRate?: number;
    isDefault?: number;
    state?: number;
}
export declare class CreateAccountDto {
    name: string;
    bankName?: string;
    iban?: string;
    ibanName?: string;
    currencyId: number;
    criticalLimit?: number;
    description?: string;
}
export declare class UpdateAccountDto {
    name?: string;
    bankName?: string;
    iban?: string;
    ibanName?: string;
    criticalLimit?: number;
    currencyId?: number;
    description?: string;
    state?: number;
}
export declare class CreateTransactionDto {
    partyId?: number;
    commercialAccountId: number;
    amount: string;
    currencyId?: number;
    type: 'in' | 'out';
    referenceType?: 'sale' | 'purchase' | 'manual_adjustment' | 'manual';
    referenceId?: number;
    date: string;
    description?: string;
}
export declare class TransactionsQueryDto extends PaginationDto {
    partyId?: number;
    type?: string;
    status?: string;
}
