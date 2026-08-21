import { Decimal } from 'decimal.js';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { Currency } from '../../currencies/entities/currency.entity';
export declare class CommercialAccount extends BaseEntity {
    name: string;
    bankName: string | null;
    iban: string | null;
    ibanName: string | null;
    currencyId: string;
    criticalLimit: Decimal;
    description: string | null;
    currency: Currency;
    balance?: string;
}
