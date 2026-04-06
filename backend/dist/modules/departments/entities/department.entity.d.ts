import { BaseEntity } from '../../../common/entities/base.entity';
import { CommercialAccount } from '../../finance/accounts/entities/commercial-account.entity';
import { DepartmentType } from './department-type.entity';
export declare class Department extends BaseEntity {
    name: string;
    description: string | null;
    abbreviation: string | null;
    departmentTypeId: number | null;
    departmentType: DepartmentType;
    commercialAccountId: number | null;
    commercialAccount: CommercialAccount;
}
