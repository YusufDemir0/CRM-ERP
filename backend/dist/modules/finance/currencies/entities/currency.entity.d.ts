import { BaseEntity } from '../../../../common/entities/base.entity';
export declare class Currency extends BaseEntity {
    code: string;
    name: string;
    symbol: string;
    exchangeRate: number;
    isDefault: number;
}
