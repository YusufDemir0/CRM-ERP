import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Transform } from 'class-transformer';
import { Decimal } from 'decimal.js';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { Party } from '../../../parties/entities/party.entity';
import { CommercialAccount } from '../../accounts/entities/commercial-account.entity';
import { Currency } from '../../currencies/entities/currency.entity';
import { DecimalTransformer } from '../../../../common/transformers/decimal.transformer';

@Entity('transactions')
@Unique(['code'])
export class Transaction extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ name: 'party_id', type: 'bigint', nullable: true })
  partyId: string | null;

  @Column({ name: 'commercial_account_id', type: 'bigint', nullable: true })
  commercialAccountId: string;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ type: 'decimal', precision: 15, scale: 2, transformer: new DecimalTransformer() })
  amount: Decimal;

  @Column({ name: 'currency_id', type: 'bigint', nullable: true })
  currencyId: string | null;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'exchange_rate', type: 'decimal', precision: 15, scale: 6, default: 1, transformer: new DecimalTransformer() })
  exchangeRate: Decimal;

  @Column({ type: 'enum', enum: ['in', 'out'] })
  type: 'in' | 'out';

  @Column({ name: 'reference_type', type: 'enum', enum: ['sale', 'purchase', 'manual_adjustment', 'manual', 'sale_deposit', 'transfer'], nullable: true })
  referenceType: 'sale' | 'purchase' | 'manual_adjustment' | 'manual' | 'sale_deposit' | 'transfer' | null;

  @Column({ name: 'reference_id', type: 'bigint', nullable: true })
  referenceId: string | null;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum:['pending', 'completed', 'bounced_check', 'cancelled'], default: 'pending' })
  status: 'pending' | 'completed' | 'bounced_check' | 'cancelled';

  @ManyToOne(() => Party)
  @JoinColumn({ name: 'party_id' })
  party: Party;

  @ManyToOne(() => CommercialAccount)
  @JoinColumn({ name: 'commercial_account_id' })
  commercialAccount: CommercialAccount;

  @ManyToOne(() => Currency, { nullable: true })
  @JoinColumn({ name: 'currency_id' })
  currency: Currency;
}