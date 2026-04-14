import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Unique } from 'typeorm';
import { Transform } from 'class-transformer';
import { Decimal } from 'decimal.js';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Party } from '../../parties/entities/party.entity';
import { SaleType } from './sale-type.entity';
import { Currency } from '../../finance/currencies/entities/currency.entity';
import { SaleItem } from './sale-item.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

@Entity('sales')
@Unique(['code'])
export class Sale extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ name: 'party_id', type: 'bigint' })
  partyId: number;

  @Column({ name: 'sale_type_id', type: 'bigint' })
  saleTypeId: number;

  @Column({ name: 'currency_id', type: 'bigint', nullable: true })
  currencyId: number | null;

  @Transform(({ value }) => value ? Number(value) : value)
  @Column({ name: 'exchange_rate', type: 'decimal', precision: 15, scale: 6, default: 1, transformer: new DecimalTransformer() })
  exchangeRate: Decimal;

  @Column({ name: 'delivery_date', type: 'date', nullable: true })
  deliveryDate: string | null;

  @Column({ type: 'enum', enum: ['draft', 'approved', 'shipped', 'invoiced', 'cancelled'], default: 'draft' })
  status: 'draft' | 'approved' | 'shipped' | 'invoiced' | 'cancelled';

  @Transform(({ value }) => value ? Number(value) : value)
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  deposit: Decimal;

  @Transform(({ value }) => value ? Number(value) : value)
  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  totalAmount: Decimal;

  @Transform(({ value }) => value ? Number(value) : value)
  @Column({ name: 'discount_amount', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  discountAmount: Decimal;

  @Transform(({ value }) => value ? Number(value) : value)
  @Column({ name: 'discount_percent', type: 'decimal', precision: 5, scale: 2, default: 0, transformer: new DecimalTransformer() })
  discountPercent: Decimal;

  @Transform(({ value }) => value ? Number(value) : value)
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  kdv: Decimal;

  @Transform(({ value }) => value ? Number(value) : value)
  @Column({ name: 'grand_total', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  grandTotal: Decimal;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => Party)
  @JoinColumn({ name: 'party_id' })
  party: Party;

  @ManyToOne(() => SaleType)
  @JoinColumn({ name: 'sale_type_id' })
  saleType: SaleType;

  @ManyToOne(() => Currency, { nullable: true })
  @JoinColumn({ name: 'currency_id' })
  currency: Currency;

  @OneToMany(() => SaleItem, (si) => si.sale)
  items: SaleItem[];
}