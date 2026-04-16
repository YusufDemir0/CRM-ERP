import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Transform } from 'class-transformer';
import { Decimal } from 'decimal.js';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Bom } from './bom.entity';
import { Department } from '../../departments/entities/department.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

@Entity('production_orders')
@Unique(['code'])
export class ProductionOrder extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ name: 'bom_id', type: 'bigint' })
  bomId: number;

  @Column({ name: 'source_department_id', type: 'bigint', nullable: true })
  sourceDepartmentId: number | null;

  @Column({ name: 'target_department_id', type: 'bigint', nullable: true })
  targetDepartmentId: number | null;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'planned_quantity', type: 'decimal', precision: 15, scale: 4, transformer: new DecimalTransformer() })
  plannedQuantity: Decimal;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'produced_quantity', type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new DecimalTransformer() })
  producedQuantity: Decimal;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'wastage_quantity', type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new DecimalTransformer() })
  wastageQuantity: Decimal;

  @Column({ type: 'enum', enum: ['draft', 'planned', 'in_progress', 'completed', 'cancelled'], default: 'draft' })
  status: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled';

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'unit_cost', type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new DecimalTransformer() })
  unitCost: Decimal;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'total_cost', type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new DecimalTransformer() })
  totalCost: Decimal;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: string | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => Bom)
  @JoinColumn({ name: 'bom_id' })
  bom: Bom;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'source_department_id' })
  sourceDepartment: Department;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'target_department_id' })
  targetDepartment: Department;
}