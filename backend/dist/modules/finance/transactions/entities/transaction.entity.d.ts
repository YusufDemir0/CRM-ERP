import { Decimal } from 'decimal.js';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { Party } from '../../../parties/entities/party.entity';
import { CommercialAccount } from '../../accounts/entities/commercial-account.entity';
import { Currency } from '../../currencies/entities/currency.entity';
export declare class Transaction extends BaseEntity {
    code: string;
    partyId: number;
    commercialAccountId: number;
    amount: Decimal;
    currencyId: number | null;
    exchangeRate: Decimal;
    type: 'in' | 'out';
    referenceType: 'sale' | 'purchase' | 'manual_adjustment' | 'manual' | null;
    referenceId: number | null;
    date: string;
    description: string | null;
    status: 'pending' | 'completed' | 'bounced_check' | 'cancelled';
    party: Party;
    commercialAccount: CommercialAccount;
    currency: Currency;
}
