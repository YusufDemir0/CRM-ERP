import { Decimal } from 'decimal.js';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { Stock } from './stock.entity';
export declare class StockMovement extends BaseEntity {
    stockId: number;
    quantity: Decimal;
    quantityBefore: Decimal;
    quantityAfter: Decimal;
    type: 'in' | 'out';
    unitCost: Decimal;
    totalCost: Decimal;
    referenceType: 'sale' | 'purchase' | 'production' | 'adjustment' | 'return' | 'manual' | 'revert' | 'shipment' | 'transfer' | 'reserve';
    referenceId: number | null;
    description: string | null;
    notes: string | null;
    stock: Stock;
}
