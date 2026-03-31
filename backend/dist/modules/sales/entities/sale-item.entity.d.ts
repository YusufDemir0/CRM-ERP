import { Sale } from './sale.entity';
import { Item } from '../../inventory/items/entities/item.entity';
export declare class SaleItem {
    saleId: number;
    itemId: number;
    quantity: number;
    price: number;
    discountAmount: number;
    discountPercent: number;
    netPrice: number;
    kdvRate: number;
    kdvAmount: number;
    lineTotal: number;
    description: string | null;
    createdBy: number | null;
    createdAt: Date;
    updatedBy: number | null;
    updatedAt: Date;
    deletedAt: Date | null;
    sale: Sale;
    item: Item;
}
