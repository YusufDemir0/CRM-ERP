import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Department } from '../../departments/entities/department.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('staff')
export class Staff {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ default: 1 })
  state: number; // 1: Active, 0: Passive

  @Column({ name: 'created_by', nullable: true, type: 'bigint' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_by', nullable: true, type: 'bigint' })
  updatedBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'entry_date', type: 'date', nullable: true })
  entryDate: string;

  @Column({ name: 'last_deactivation_date', type: 'date', nullable: true })
  lastDeactivationDate: string | null;

  @Column({ type: 'varchar', length: 11, nullable: true })
  tckn: string | null;

  @Column({ name: 'department_id', type: 'bigint' })
  departmentId: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by' })
  updator: User;
}
