import { Decimal } from 'decimal.js';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { Party } from '../../../parties/entities/party.entity';
import { CommercialAccount } from '../../accounts/entities/commercial-account.entity';
import { Currency } from '../../currencies/entities/currency.entity';
export declare class Transaction extends BaseEntity {
    code: string;
    partyId: string | null;
    commercialAccountId: string;
    amount: Decimal;
    currencyId: string | null;
    exchangeRate: Decimal;
    type: 'in' | 'out';
    referenceType: 'sale' | 'purchase' | 'manual_adjustment' | 'manual' | 'sale_deposit' | 'transfer' | null;
    referenceId: string | null;
    date: string;
    description: string | null;
    status: 'pending' | 'completed' | 'bounced_check' | 'cancelled';
    party: Party;
    commercialAccount: CommercialAccount;
    currency: Currency;
}
