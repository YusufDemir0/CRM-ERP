import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Transform } from 'class-transformer';
import { Decimal } from 'decimal.js';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { ItemType } from './item-type.entity';
import { ItemCodeGroup } from './item-code-group.entity';
import { Party } from '../../../parties/entities/party.entity';
import { Currency } from '../../../finance/currencies/entities/currency.entity';
import { QuantityType } from './quantity-type.entity';
import { DecimalTransformer } from '../../../../common/transformers/decimal.transformer';

@Entity('items')
export class Item extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Index()
  @Column({ name: 'item_type_id', type: 'bigint' })
  itemTypeId: number;

  @Column({ name: 'item_code_group_id', type: 'bigint', nullable: true })
  itemCodeGroupId: number | null;

  @Index({ unique: true })
  @Column({ name: 'code', type: 'varchar', length: 50 })
  code: string;

  @Column({ name: 'code1', type: 'varchar', length: 50, nullable: true })
  code1: string | null;

  @Column({ name: 'code2', type: 'varchar', length: 50, nullable: true })
  code2: string | null;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'critical_limit', type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new DecimalTransformer() })
  criticalLimit: Decimal;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image: string | null;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'purchase_price', type: 'decimal', precision: 15, scale: 2, nullable: true, transformer: new DecimalTransformer() })
  purchasePrice: Decimal | null;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'moving_average_cost', type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new DecimalTransformer() })
  movingAverageCost: Decimal;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'sale_price', type: 'decimal', precision: 15, scale: 2, nullable: true, transformer: new DecimalTransformer() })
  salePrice: Decimal | null;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'net_price', type: 'decimal', precision: 15, scale: 2, nullable: true, transformer: new DecimalTransformer() })
  netPrice: Decimal | null;

  @Index()
  @Column({ name: 'currency_id', type: 'bigint', nullable: true })
  currencyId: number | null;

  @Column({ name: 'quantity_type_id', type: 'bigint' })
  quantityTypeId: number;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 20, transformer: new DecimalTransformer() })
  kdv: Decimal;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'total_stock', type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new DecimalTransformer() })
  totalStock: Decimal;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => ItemType)
  @JoinColumn({ name: 'item_type_id' })
  itemType: ItemType;

  @ManyToOne(() => ItemCodeGroup, { nullable: true })
  @JoinColumn({ name: 'item_code_group_id' })
  itemCodeGroup: ItemCodeGroup;

  @Index()
  @Column({ name: 'provider_id', type: 'bigint', nullable: true })
  providerId: number | null;

  @ManyToOne(() => Party, { nullable: true })
  @JoinColumn({ name: 'provider_id' })
  provider: Party;

  @ManyToOne(() => Currency, { nullable: true })
  @JoinColumn({ name: 'currency_id' })
  currency: Currency;

  @ManyToOne(() => QuantityType)
  @JoinColumn({ name: 'quantity_type_id' })
  quantityType: QuantityType;
}
