import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { RecordState } from '../enums/record-state.enum';

/**
 * BaseEntity — Tüm entity'lerin extend edeceği temel sınıf.
 * Ortak alanlar: id, state, created_by, created_at, updated_by, updated_at, deleted_at
 *
 * NOT: TypeORM'un kendi BaseEntity sınıfını kullanmıyoruz (Active Record pattern).
 * Repository pattern kullanacağız.
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'tinyint', default: RecordState.ACTIVE })
  state: RecordState;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: number | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}
