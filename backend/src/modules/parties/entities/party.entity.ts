import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Currency } from '../../finance/currencies/entities/currency.entity';

@Entity('parties')
export class Party extends BaseEntity {
  @Column({ type: 'enum', enum: ['customer', 'provider', 'both'], default: 'customer' })
  type: 'customer' | 'provider' | 'both';

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone1: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone2: string | null;

  @Column({ name: 'tax_number', type: 'varchar', length: 20, nullable: true })
  taxNumber: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column({ name: 'credit_limit_plus', type: 'decimal', precision: 15, scale: 2, default: 0 })
  creditLimitPlus: number;

  @Column({ name: 'credit_limit_minus', type: 'decimal', precision: 15, scale: 2, default: 0 })
  creditLimitMinus: number;

  @Column({ name: 'payment_terms', type: 'varchar', length: 50, nullable: true })
  paymentTerms: string | null;

  @Column({ name: 'currency_id', type: 'bigint', nullable: true })
  currencyId: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => Currency, { nullable: true })
  @JoinColumn({ name: 'currency_id' })
  currency: Currency;
}
