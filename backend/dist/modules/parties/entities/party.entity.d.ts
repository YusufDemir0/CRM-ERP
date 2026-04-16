import { Decimal } from 'decimal.js';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Currency } from '../../finance/currencies/entities/currency.entity';
export declare class Party extends BaseEntity {
    type: 'customer' | 'provider' | 'both';
    name: string;
    phone1: string | null;
    phone2: string | null;
    taxOffice: string | null;
    taxNumber: string | null;
    email: string | null;
    address: string | null;
    cityId: number | null;
    districtName: string | null;
    balance: Decimal;
    creditLimit: Decimal;
    paymentTerms: string | null;
    currencyId: number | null;
    notes: string | null;
    currency: Currency;
}
