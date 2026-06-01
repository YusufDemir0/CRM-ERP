import { EntityManager } from 'typeorm';
import { Decimal } from 'decimal.js';
import { Stock } from '../entities/stock.entity';
import { StockMovement } from '../entities/stock-movement.entity';
export declare class StockMovementHelper {
    static applyMovement(params: {
        stock: Stock;
        quantity: Decimal;
        type: 'in' | 'out';
        referenceInfo?: {
            type: StockMovement['referenceType'];
            id: string;
            description: string;
        };
        userId?: string;
        manager: EntityManager;
    }): StockMovement;
    static validateStockLimit(itemId: string, departmentId: string, currentQty: Decimal, delta: Decimal): void;
}
