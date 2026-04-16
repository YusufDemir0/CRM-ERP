import { Decimal } from 'decimal.js';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { Stock } from './stock.entity';
export declare class StockMovement extends BaseEntity {
    stockId: number;
    quantity: Decimal;
    quantityBefore: Decimal;
    quantityAfter: Decimal;
    type: 'in' | 'out';
    referenceType: 'sale' | 'purchase' | 'production' | 'adjustment' | 'return' | 'manual';
    referenceId: number | null;
    description: string | null;
    notes: string | null;
    stock: Stock;
}
