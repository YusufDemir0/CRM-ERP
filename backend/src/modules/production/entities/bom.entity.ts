import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BomItem } from './bom-item.entity';

@Entity('boms')
export class Bom extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @OneToMany(() => BomItem, (bi) => bi.bom)
  items: BomItem[];
}
