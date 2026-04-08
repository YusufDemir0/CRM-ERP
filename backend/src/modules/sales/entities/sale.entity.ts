import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Party } from '../../parties/entities/party.entity';
import { SaleType } from './sale-type.entity';
import { Currency } from '../../finance/currencies/entities/currency.entity';
import { SaleItem } from './sale-item.entity';

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

  @Column({ name: 'exchange_rate', type: 'decimal', precision: 15, scale: 6, default: 1 })
  exchangeRate: number;

  @Column({ name: 'delivery_date', type: 'date', nullable: true })
  deliveryDate: string | null;

  @Column({ type: 'enum', enum: ['draft', 'approved', 'shipped', 'invoiced', 'cancelled'], default: 'draft' })
  status: 'draft' | 'approved' | 'shipped' | 'invoiced' | 'cancelled';

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  deposit: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'discount_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercent: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  kdv: number;

  @Column({ name: 'grand_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  grandTotal: number;

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