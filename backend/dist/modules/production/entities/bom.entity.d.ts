import { BaseEntity } from '../../../common/entities/base.entity';
import { BomItem } from './bom-item.entity';
import { Item } from '../../inventory/items/entities/item.entity';
export declare class Bom extends BaseEntity {
    name: string;
    targetItemId: number | null;
    version: number;
    isActive: boolean;
    description: string | null;
    targetItem: Item;
    items: BomItem[];
}
