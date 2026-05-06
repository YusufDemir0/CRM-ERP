import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Party } from './party.entity';
import { CommercialAccount } from '../../finance/accounts/entities/commercial-account.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';
import { Decimal } from 'decimal.js';

@Entity('accounting_ledger')
@Index(['partyId', 'date'])
export class AccountingLedger extends BaseEntity {
  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'party_id' })
  partyId: string;

  @Column({ name: 'account_id', type: 'bigint', nullable: true })
  accountId: string | null;

  @ManyToOne(() => CommercialAccount)
  @JoinColumn({ name: 'account_id' })
  account: CommercialAccount;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0, transformer: new DecimalTransformer() })
  debit: Decimal;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0, transformer: new DecimalTransformer() })
  credit: Decimal;

  @Column({ name: 'transaction_id', nullable: true })
  transactionId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  source: string;
  
  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => Party)
  @JoinColumn({ name: 'party_id' })
  party: Party;
}
