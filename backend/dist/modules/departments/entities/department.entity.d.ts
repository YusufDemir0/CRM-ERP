import { BaseEntity } from '../../../common/entities/base.entity';
import { CommercialAccount } from '../../finance/accounts/entities/commercial-account.entity';
import { DepartmentType } from './department-type.entity';
export declare class Department extends BaseEntity {
    name: string;
    description: string | null;
    abbreviation: string | null;
    departmentTypeId: string | null;
    departmentType: DepartmentType;
    commercialAccountId: string | null;
    commercialAccount: CommercialAccount;
    cityId: string | null;
}
