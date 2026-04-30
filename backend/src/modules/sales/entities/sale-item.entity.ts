import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Transform } from 'class-transformer';
import { Decimal } from 'decimal.js';
import { Sale } from './sale.entity';
import { Item } from '../../inventory/items/entities/item.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

@Entity('sale_items')
export class SaleItem {
  @PrimaryColumn({ name: 'sale_id', type: 'bigint' })
  saleId: number;

  @PrimaryColumn({ name: 'item_id', type: 'bigint' })
  itemId: number;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ type: 'decimal', precision: 15, scale: 4, transformer: new DecimalTransformer() })
  quantity: Decimal;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'shipped_quantity', type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new DecimalTransformer() })
  shippedQuantity: Decimal;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ type: 'decimal', precision: 15, scale: 2, transformer: new DecimalTransformer() })
  price: Decimal;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'cost_price', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  costPrice: Decimal;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'discount_amount', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  discountAmount: Decimal;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'discount_percent', type: 'decimal', precision: 5, scale: 2, default: 0, transformer: new DecimalTransformer() })
  discountPercent: Decimal;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'net_price', type: 'decimal', precision: 15, scale: 2, transformer: new DecimalTransformer() })
  netPrice: Decimal;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'kdv_rate', type: 'decimal', precision: 5, scale: 2, default: 20, transformer: new DecimalTransformer() })
  kdvRate: Decimal;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'kdv_amount', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  kdvAmount: Decimal;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'line_total', type: 'decimal', precision: 15, scale: 2, transformer: new DecimalTransformer() })
  lineTotal: Decimal;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: number | null;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: number | null;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Sale, (sale) => sale.items)
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;
}
