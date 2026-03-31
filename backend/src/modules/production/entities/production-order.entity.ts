import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Bom } from './bom.entity';

@Entity('production_orders')
@Unique(['code'])
export class ProductionOrder extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ name: 'bom_id', type: 'bigint' })
  bomId: number;

  @Column({ name: 'planned_quantity', type: 'decimal', precision: 15, scale: 4 })
  plannedQuantity: number;

  @Column({ name: 'produced_quantity', type: 'decimal', precision: 15, scale: 4, default: 0 })
  producedQuantity: number;

  @Column({ name: 'wastage_quantity', type: 'decimal', precision: 15, scale: 4, default: 0 })
  wastageQuantity: number;

  @Column({ type: 'enum', enum: ['draft', 'planned', 'in_progress', 'completed', 'cancelled'], default: 'draft' })
  status: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled';

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: string | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => Bom)
  @JoinColumn({ name: 'bom_id' })
  bom: Bom;
}
