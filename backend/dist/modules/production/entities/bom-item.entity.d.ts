import { Bom } from './bom.entity';
import { Item } from '../../inventory/items/entities/item.entity';
export declare class BomItem {
    bomId: number;
    itemId: number;
    quantity: number;
    description: string | null;
    createdBy: number | null;
    createdAt: Date;
    updatedBy: number | null;
    updatedAt: Date;
    deletedAt: Date | null;
    bom: Bom;
    item: Item;
}
