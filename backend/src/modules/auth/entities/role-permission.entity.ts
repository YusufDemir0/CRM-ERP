import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryColumn({ name: 'role_id', type: 'bigint' })
  roleId: number;

  @PrimaryColumn({ name: 'permission_id', type: 'bigint' })
  permissionId: number;

  @Column({ type: 'tinyint', default: 1 })
  state: number;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission)
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}
