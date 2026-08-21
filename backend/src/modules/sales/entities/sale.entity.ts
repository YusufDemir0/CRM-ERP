import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Unique, Index } from 'typeorm';
import { Transform } from 'class-transformer';
import { Decimal } from 'decimal.js';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Party } from '../../parties/entities/party.entity';
import { SaleType } from './sale-type.entity';
import { Currency } from '../../finance/currencies/entities/currency.entity';
import { SaleItem } from './sale-item.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';
import { Staff } from '../../staff/entities/staff.entity';
import { CommercialAccount } from '../../finance/accounts/entities/commercial-account.entity';
import { Department } from '../../departments/entities/department.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('sales')
@Unique(['code'])
@Index('IDX_SALE_FULLTEXT', ['code', 'notes', 'phone', 'address', 'city', 'district', 'taxNumber', 'email', 'source'], { fulltext: true })
export class Sale extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Index()
  @Column({ name: 'party_id', type: 'bigint' })
  partyId: string;

  @Index()
  @Column({ name: 'sale_type_id', type: 'bigint' })
  saleTypeId: string;

  @Index()
  @Column({ name: 'department_id', type: 'bigint', nullable: true })
  departmentId: string | null;

  @Index()
  @Column({ name: 'staff_id', type: 'bigint', nullable: true })
  staffId: string | null;

  @Index()
  @Column({ name: 'currency_id', type: 'bigint', nullable: true })
  currencyId: string | null;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'exchange_rate', type: 'decimal', precision: 15, scale: 6, default: 1, transformer: new DecimalTransformer() })
  exchangeRate: Decimal = new Decimal(1);

  @Index()
  @Column({ name: 'delivery_date', type: 'date', nullable: true })
  deliveryDate: string | null;

  @Index()
  @Column({ type: 'enum', enum: ['draft', 'approved', 'shipped', 'invoiced', 'cancelled'], default: 'draft' })
  status: 'draft' | 'approved' | 'shipped' | 'invoiced' | 'cancelled';

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'deposit', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  deposit: Decimal = new Decimal(0);

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  totalAmount: Decimal = new Decimal(0);

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'discount_amount', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  discountAmount: Decimal = new Decimal(0);

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'discount_percent', type: 'decimal', precision: 5, scale: 2, default: 0, transformer: new DecimalTransformer() })
  discountPercent: Decimal = new Decimal(0);

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'kdv', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  kdv: Decimal = new Decimal(0);

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'grand_total', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  grandTotal: Decimal = new Decimal(0);

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'total_cost', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  totalCost: Decimal = new Decimal(0);

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'profit', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  profit: Decimal = new Decimal(0);

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'paid_amount', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  paidAmount: Decimal = new Decimal(0);

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'contact_phone', type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ name: 'address_detail', type: 'text', nullable: true })
  address: string | null;

  @Column({ name: 'address_city', type: 'varchar', length: 50, nullable: true })
  city: string | null;

  @Column({ name: 'address_district', type: 'varchar', length: 50, nullable: true })
  district: string | null;

  @Column({ name: 'contact_tax_id', type: 'varchar', length: 20, nullable: true })
  taxNumber: string | null;

  @Column({ name: 'contact_email', type: 'varchar', length: 100, nullable: true })
  email: string | null;

  @Column({ name: 'lead_source', type: 'varchar', length: 50, nullable: true })
  source: string | null;

  @Column({ name: 'commercial_account_id', type: 'bigint', nullable: true })
  commercialAccountId: string | null;

  @Column({ name: 'maturity_days', type: 'int', default: 0 })
  maturityDays: number;

  @Column({ name: 'payment_type', type: 'varchar', length: 20, default: 'NAKİT' })
  paymentType: string;

  @Column({ name: 'installments', type: 'int', default: 1 })
  installments: number;

  @Column({ name: 'cancelled_by_id', type: 'bigint', nullable: true })
  cancelledById: string | null;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'cancel_reason', type: 'text', nullable: true })
  cancelReason: string | null;

  @ManyToOne(() => Party)
  @JoinColumn({ name: 'party_id' })
  party: Party;

  @ManyToOne(() => SaleType)
  @JoinColumn({ name: 'sale_type_id' })
  saleType: SaleType;

  @ManyToOne(() => Currency, { nullable: true })
  @JoinColumn({ name: 'currency_id' })
  currency: Currency;

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: 'staff_id' })
  staff: Staff | null;

  @ManyToOne(() => CommercialAccount, { nullable: true })
  @JoinColumn({ name: 'commercial_account_id' })
  commercialAccount: CommercialAccount | null;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department: Department | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'cancelled_by_id' })
  cancelledBy: User | null;

  @OneToMany(() => SaleItem, (si) => si.sale)
  items: SaleItem[];
}