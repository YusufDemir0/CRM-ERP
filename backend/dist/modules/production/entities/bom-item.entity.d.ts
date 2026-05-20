import { Decimal } from 'decimal.js';
import { Bom } from './bom.entity';
import { Item } from '../../inventory/items/entities/item.entity';
export declare class BomItem {
    bomId: string;
    itemId: string;
    quantity: Decimal;
    description: string | null;
    createdBy: string | null;
    createdAt: Date;
    updatedBy: number | null;
    updatedAt: Date;
    deletedAt: Date | null;
    bom: Bom;
    item: Item;
}
