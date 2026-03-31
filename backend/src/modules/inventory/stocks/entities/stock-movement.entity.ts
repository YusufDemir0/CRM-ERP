import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { Stock } from './stock.entity';

@Entity('stock_movements')
export class StockMovement extends BaseEntity {
  @Column({ name: 'stock_id', type: 'bigint' })
  stockId: number;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  quantity: number;

  @Column({ name: 'quantity_before', type: 'decimal', precision: 15, scale: 4 })
  quantityBefore: number;

  @Column({ name: 'quantity_after', type: 'decimal', precision: 15, scale: 4 })
  quantityAfter: number;

  @Column({ type: 'enum', enum: ['in', 'out'] })
  type: 'in' | 'out';

  @Column({ name: 'reference_type', type: 'enum', enum: ['sale', 'purchase', 'production', 'adjustment', 'return', 'manual'] })
  referenceType: 'sale' | 'purchase' | 'production' | 'adjustment' | 'return' | 'manual';

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
