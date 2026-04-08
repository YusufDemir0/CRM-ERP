import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';

@Entity('item_code_groups')
export class ItemCodeGroup extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  prefix: string;

  @Column({ type: 'tinyint', default: 1 })
  state: number; // 1: Active, 0: Passive
}
