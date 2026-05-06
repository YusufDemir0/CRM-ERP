import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('item_code_sequences')
export class ItemCodeSequence {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ name: 'item_code_group_id', type: 'bigint', unique: true })
  itemCodeGroupId: string;

  @Column({ name: 'current_number', type: 'int', default: 1 })
  currentNumber: number;
}
