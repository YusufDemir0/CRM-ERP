import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';

@Entity('item_types')
export class ItemType extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  abbreviation: string;

  @Column({ name: 'is_excluded_from_bom', type: 'boolean', default: false })
  isExcludedFromBom: boolean;
}
