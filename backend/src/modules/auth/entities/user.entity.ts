import {
  Entity,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Department } from '../../departments/entities/department.entity';
import { Role } from './role.entity';

@Entity('users')
@Index("UQ_USERNAME_ACTIVE", ["username"], { where: "deleted_at IS NULL", unique: true })
@Index("UQ_EMAIL_ACTIVE", ["email"], { where: "deleted_at IS NULL", unique: true })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  username: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ name: 'full_name', type: 'varchar', length: 100 })
  fullName: string;

  @Column({ type: 'varchar', length: 100 })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ name: 'department_id', type: 'bigint', nullable: true })
  departmentId: number | null;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ name: 'failed_login_attempts', type: 'int', default: 0 })
  failedLoginAttempts: number;

  @ManyToMany(() => Role)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];
}
