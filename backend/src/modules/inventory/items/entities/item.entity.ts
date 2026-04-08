import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { ItemType } from './item-type.entity';
import { ItemCodeGroup } from './item-code-group.entity';
import { Party } from '../../../parties/entities/party.entity';
import { Currency } from '../../../finance/currencies/entities/currency.entity';
import { QuantityType } from './quantity-type.entity';

@Entity('items')
@Unique(['code'])
export class Item extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'item_type_id', type: 'bigint' })
  itemTypeId: number;

  @Column({ name: 'item_code_group_id', type: 'bigint', nullable: true })
  itemCodeGroupId: number | null;

  @Column({ name: 'code', type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ name: 'code1', type: 'varchar', length: 50, nullable: true })
  code1: string | null;

  @Column({ name: 'code2', type: 'varchar', length: 50, nullable: true })
  code2: string | null;

  @Column({ name: 'critical_limit', type: 'decimal', precision: 15, scale: 4, default: 0 })
  criticalLimit: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image: string | null;

  @Column({ name: 'purchase_price', type: 'decimal', precision: 15, scale: 2, nullable: true })
  purchasePrice: number | null;

  @Column({ name: 'sale_price', type: 'decimal', precision: 15, scale: 2, nullable: true })
  salePrice: number | null;

  @Column({ name: 'net_price', type: 'decimal', precision: 15, scale: 2, nullable: true })
  netPrice: number | null;

  @Column({ name: 'currency_id', type: 'bigint', nullable: true })
  currencyId: number | null;

  @Column({ name: 'quantity_type_id', type: 'bigint' })
  quantityTypeId: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 20 })
  kdv: number;

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
