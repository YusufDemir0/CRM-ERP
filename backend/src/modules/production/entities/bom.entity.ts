import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BomItem } from './bom-item.entity';
import { Item } from '../../inventory/items/entities/item.entity';

@Entity('boms')
export class Bom extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'target_item_id', type: 'bigint', nullable: true })
  targetItemId: number | null;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ManyToOne(() => Item, { nullable: true })
  @JoinColumn({ name: 'target_item_id' })
  targetItem: Item;

  @OneToMany(() => BomItem, (bi) => bi.bom)
  items: BomItem[];
}