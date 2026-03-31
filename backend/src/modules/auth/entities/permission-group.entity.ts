import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Permission } from './permission.entity';

@Entity('permission_groups')
export class PermissionGroup extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ManyToMany(() => Permission)
  @JoinTable({
    name: 'permission_group_items',
    joinColumn: { name: 'group_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];
}
