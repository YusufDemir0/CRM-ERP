import { Entity, Column, ManyToOne, JoinColumn, Unique, Check } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { Item } from '../../items/entities/item.entity';
import { Department } from '../../../departments/entities/department.entity';

@Entity('stocks')
@Unique(['itemId', 'departmentId'])
@Check(`"quantity" >= 0`)
export class Stock extends BaseEntity {
  @Column({ name: 'item_id', type: 'bigint' })
  itemId: number;

  @Column({ name: 'department_id', type: 'bigint' })
  departmentId: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  quantity: number;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'department_id' })
  department: Department;
}