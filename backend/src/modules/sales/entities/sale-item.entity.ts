import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Transform } from 'class-transformer';
import { Decimal } from 'decimal.js';
import { Sale } from './sale.entity';
import { Item } from '../../inventory/items/entities/item.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

@Entity('sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'sale_id', type: 'bigint' })
  saleId: string;

  @Column({ name: 'item_id', type: 'bigint' })
  itemId: string;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'quantity', type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new DecimalTransformer() })
  quantity: Decimal = new Decimal(0);

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'shipped_quantity', type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new DecimalTransformer() })
  shippedQuantity: Decimal = new Decimal(0);

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'price', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  price: Decimal = new Decimal(0);

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'cost_price', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  costPrice: Decimal = new Decimal(0);

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'discount_amount', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  discountAmount: Decimal = new Decimal(0);

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'discount_percent', type: 'decimal', precision: 5, scale: 2, default: 0, transformer: new DecimalTransformer() })
  discountPercent: Decimal = new Decimal(0);

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'net_price', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  netPrice: Decimal = new Decimal(0);

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'kdv_rate', type: 'decimal', precision: 5, scale: 2, default: 20, transformer: new DecimalTransformer() })
  kdvRate: Decimal = new Decimal(20);

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'kdv_amount', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  kdvAmount: Decimal = new Decimal(0);

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'line_total', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: new DecimalTransformer() })
  lineTotal: Decimal = new Decimal(0);

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Sale, (sale) => sale.items)
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;
}
