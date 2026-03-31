import { BaseEntity } from '../../../common/entities/base.entity';
import { CommercialAccount } from '../../finance/accounts/entities/commercial-account.entity';
export declare class Department extends BaseEntity {
    name: string;
    description: string | null;
    abbreviation: string | null;
    commercialAccountId: number | null;
    commercialAccount: CommercialAccount;
}
