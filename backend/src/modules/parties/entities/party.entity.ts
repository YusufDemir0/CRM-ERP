import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Transform } from 'class-transformer';
import { Decimal } from 'decimal.js';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Currency } from '../../finance/currencies/entities/currency.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

@Entity('parties')
@Index("UQ_PARTY_TAX_NUMBER_ACTIVE", ["taxNumber"], { where: "deleted_at IS NULL", unique: true })
export class Party extends BaseEntity {
  @Column({ type: 'enum', enum: ['customer', 'provider', 'both'], default: 'customer' })
  type: 'customer' | 'provider' | 'both';

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone1: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone2: string | null;

  @Column({ name: 'tax_office', type: 'varchar', length: 100, nullable: true })
  taxOffice: string | null;

  @Column({ name: 'tax_number', type: 'varchar', length: 20, nullable: true })
  taxNumber: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ name: 'city_id', type: 'int', nullable: true })
  cityId: number | null;

  @Column({ name: 'district_name', type: 'varchar', length: 100, nullable: true })
  districtName: string | null;

  @Transform(({ value }) => value ? Number(value) : value)
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  balance: Decimal;

  @Transform(({ value }) => value ? Number(value) : value)
  @Column({ name: 'credit_limit', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  creditLimit: Decimal;

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
