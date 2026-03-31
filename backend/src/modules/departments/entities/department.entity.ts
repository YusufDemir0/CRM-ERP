import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CommercialAccount } from '../../finance/accounts/entities/commercial-account.entity';

@Entity('departments')
export class Department extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  abbreviation: string | null;

  @Column({ name: 'commercial_account_id', type: 'bigint', nullable: true })
  commercialAccountId: number | null;

  @ManyToOne(() => CommercialAccount, { nullable: true })
  @JoinColumn({ name: 'commercial_account_id' })
  commercialAccount: CommercialAccount;
}
