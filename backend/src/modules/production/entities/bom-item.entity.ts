import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, DeleteDateColumn } from 'typeorm';
import { Transform } from 'class-transformer';
import { Decimal } from 'decimal.js';
import { Bom } from './bom.entity';
import { Item } from '../../inventory/items/entities/item.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

@Entity('bom_items')
export class BomItem {
  @PrimaryColumn({ name: 'bom_id', type: 'bigint' })
  bomId: string;

  @PrimaryColumn({ name: 'item_id', type: 'bigint' })
  itemId: string;

  @Transform(({ value }) => value ? String(value) : value)
  @Column({ type: 'decimal', precision: 15, scale: 4, transformer: new DecimalTransformer() })
  quantity: Decimal;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: number | null;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Bom, (bom) => bom.items)
  @JoinColumn({ name: 'bom_id' })
  bom: Bom;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;
}
