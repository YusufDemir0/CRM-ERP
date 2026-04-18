import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index()
  @Column({ name: 'entity_name', type: 'varchar', length: 100 })
  entityName: string;

  @Index()
  @Column({ name: 'entity_id', type: 'bigint', nullable: true })
  entityId: number | null;

  @Column({ type: 'varchar', length: 50 })
  action: 'insert' | 'update' | 'delete';

  @Column({ name: 'old_values', type: 'text', nullable: true })
  oldValues: string | null;

  @Column({ name: 'new_values', type: 'text', nullable: true })
  newValues: string | null;

  @Index()
  @Column({ name: 'user_id', type: 'bigint', nullable: true })
  userId: number | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
