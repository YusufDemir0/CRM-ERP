import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Decimal } from 'decimal.js';
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
    currencyId: string;
    criticalLimit?: Decimal;
    description?: string;
}
export declare class UpdateAccountDto {
    name?: string;
    bankName?: string;
    iban?: string;
    ibanName?: string;
    criticalLimit?: Decimal;
    currencyId: string;
    description?: string;
    state?: number;
}
export declare class CreateTransactionDto {
    partyId: string;
    commercialAccountId: string;
    amount: string;
    currencyId: string;
    type: 'in' | 'out';
    referenceType?: 'sale' | 'purchase' | 'manual_adjustment' | 'manual' | 'sale_deposit';
    referenceId: string;
    date: string;
    description?: string;
}
export declare class TransactionsQueryDto extends PaginationDto {
    partyId: string;
    type?: string;
    status?: string;
}
export declare class AccountsQueryDto extends PaginationDto {
    state?: number;
}
