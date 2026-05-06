import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('system_logs')
export class SystemLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'bigint', nullable: true })
  userId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  username: string;

  @Column({ name: 'full_name', type: 'varchar', length: 200, nullable: true })
  fullName: string;

  @Column({ type: 'varchar', length: 255 })
  action: string;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  module: string;

  @Index()
  @Column({ type: 'varchar', length: 50, default: 'INFO' })
  tag: string;

  @Column('text', { nullable: true })
  details: string;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Index()
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;
}
