import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('transaction_sequences')
@Unique(['prefix'])
export class TransactionSequence {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 10 })
  prefix: string;

  @Column({ name: 'current_number', type: 'int', default: 1 })
  currentNumber: number;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: number | null;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: number | null;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ type: 'tinyint', default: 1 })
  state: number;
}
