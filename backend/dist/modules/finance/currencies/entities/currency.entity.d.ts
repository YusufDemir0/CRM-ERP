import { Decimal } from 'decimal.js';
import { BaseEntity } from '../../../../common/entities/base.entity';
export declare class Currency extends BaseEntity {
    code: string;
    name: string;
    symbol: string;
    exchangeRate: Decimal;
    isDefault: number;
}
