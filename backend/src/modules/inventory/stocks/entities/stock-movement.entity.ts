import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Decimal } from 'decimal.js';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { Stock } from './stock.entity';
import { DecimalTransformer } from '../../../../common/transformers/decimal.transformer';

@Entity('stock_movements')
export class StockMovement extends BaseEntity {
  @Index()
  @Column({ name: 'stock_id', type: 'bigint' })
  stockId: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, transformer: new DecimalTransformer() })
  quantity: Decimal;

  @Column({ name: 'quantity_before', type: 'decimal', precision: 15, scale: 4, transformer: new DecimalTransformer() })
  quantityBefore: Decimal;

  @Column({ name: 'quantity_after', type: 'decimal', precision: 15, scale: 4, transformer: new DecimalTransformer() })
  quantityAfter: Decimal;

  @Column({ type: 'enum', enum: ['in', 'out'] })
  type: 'in' | 'out';

  @Index()
  @Column({ name: 'reference_type', type: 'enum', enum: ['sale', 'purchase', 'production', 'adjustment', 'return', 'manual'] })
  referenceType: 'sale' | 'purchase' | 'production' | 'adjustment' | 'return' | 'manual';

  @Index()
  @Column({ name: 'reference_id', type: 'bigint', nullable: true })
  referenceId: number | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => Stock)
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;
}
