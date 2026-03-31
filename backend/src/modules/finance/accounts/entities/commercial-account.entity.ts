import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { Currency } from '../../currencies/entities/currency.entity';

@Entity('commercial_accounts')
export class CommercialAccount extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'bank_name', type: 'varchar', length: 100, nullable: true })
  bankName: string | null;

  @Column({ type: 'varchar', length: 34, nullable: true })
  iban: string | null;

  @Column({ name: 'iban_name', type: 'varchar', length: 100, nullable: true })
  ibanName: string | null;

  @Column({ name: 'currency_id', type: 'bigint' })
  currencyId: number;

  @Column({ name: 'critical_limit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  criticalLimit: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ManyToOne(() => Currency)
  @JoinColumn({ name: 'currency_id' })
  currency: Currency;
}
