import { BaseEntity } from '../../../common/entities/base.entity';
import { Party } from './party.entity';
import { CommercialAccount } from '../../finance/accounts/entities/commercial-account.entity';
import { Decimal } from 'decimal.js';
export declare class AccountingLedger extends BaseEntity {
    date: string;
    partyId: string;
    accountId: string | null;
    account: CommercialAccount;
    debit: Decimal;
    credit: Decimal;
    transactionId: string;
    source: string;
    description: string;
    party: Party;
}
