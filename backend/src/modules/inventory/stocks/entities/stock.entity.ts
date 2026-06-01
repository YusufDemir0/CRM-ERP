import { Entity, Column, ManyToOne, JoinColumn, Unique, Check, Index } from 'typeorm';
import { Transform } from 'class-transformer';
import { Decimal } from 'decimal.js';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { Item } from '../../items/entities/item.entity';
import { Department } from '../../../departments/entities/department.entity';
import { DecimalTransformer } from '../../../../common/transformers/decimal.transformer';

@Entity('stocks')
@Unique(['itemId', 'departmentId'])
export class Stock extends BaseEntity {
  @Column({ name: 'item_id', type: 'bigint' })
  itemId: string;

  @Index()
  @Column({ name: 'department_id', type: 'bigint' })
  departmentId: string;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new DecimalTransformer() })
  quantity: Decimal;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ name: 'reserved_quantity', type: 'decimal', precision: 15, scale: 4, default: 0, transformer: new DecimalTransformer() })
  reservedQuantity: Decimal;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'department_id' })
  department: Department;
}