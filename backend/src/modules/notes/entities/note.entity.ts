import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('user_notes')
export class UserNote {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'bigint' })
  userId: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  title: string;

  @Column('text')
  content: string;

  @Column({ type: 'varchar', length: 20, default: '#ffffff' })
  color: string;

  @Index()
  @Column({ name: 'is_pinned', type: 'tinyint', width: 1, default: 0 })
  isPinned: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  status: string;

  @Column({ type: 'tinyint', width: 1, default: 1 })
  state: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
