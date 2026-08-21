import { Decimal } from 'decimal.js';
import { Sale } from './sale.entity';
import { Item } from '../../inventory/items/entities/item.entity';
export declare class SaleItem {
    id: string;
    saleId: string;
    itemId: string;
    quantity: Decimal;
    shippedQuantity: Decimal;
    price: Decimal;
    costPrice: Decimal;
    discountAmount: Decimal;
    discountPercent: Decimal;
    netPrice: Decimal;
    kdvRate: Decimal;
    kdvAmount: Decimal;
    lineTotal: Decimal;
    description: string | null;
    createdBy: string | null;
    createdAt: Date;
    updatedBy: string | null;
    updatedAt: Date;
    deletedAt: Date | null;
    sale: Sale;
    item: Item;
}
