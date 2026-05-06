import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CommercialAccount } from '../../finance/accounts/entities/commercial-account.entity';
import { DepartmentType } from './department-type.entity';

@Entity('departments')
export class Department extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  abbreviation: string | null;

  @Column({ name: 'department_type_id', type: 'bigint', nullable: true })
  departmentTypeId: string | null;

  @ManyToOne(() => DepartmentType, { nullable: true })
  @JoinColumn({ name: 'department_type_id' })
  departmentType: DepartmentType;

  @Column({ name: 'commercial_account_id', type: 'bigint', nullable: true })
  commercialAccountId: string | null;

  @ManyToOne(() => CommercialAccount, { nullable: true })
  @JoinColumn({ name: 'commercial_account_id' })
  commercialAccount: CommercialAccount;

  @Column({ name: 'city_id', type: 'int', nullable: true })
  cityId: string | null;
}
