import { BaseEntity } from '../../../common/entities/base.entity';
import { Party } from './party.entity';
import { Decimal } from 'decimal.js';
export declare class AccountingLedger extends BaseEntity {
    date: string;
    partyId: number;
    accountId: number;
    debit: Decimal;
    credit: Decimal;
    transactionId: number;
    source: string;
    description: string;
    party: Party;
}
