import { BaseEntity } from '../../../common/entities/base.entity';
import { BomItem } from './bom-item.entity';
export declare class Bom extends BaseEntity {
    name: string;
    description: string | null;
    items: BomItem[];
}
