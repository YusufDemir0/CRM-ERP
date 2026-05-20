import { Decimal } from 'decimal.js';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { Item } from '../../items/entities/item.entity';
import { Department } from '../../../departments/entities/department.entity';
export declare class Stock extends BaseEntity {
    itemId: string;
    departmentId: string;
    quantity: Decimal;
    reservedQuantity: Decimal;
    item: Item;
    department: Department;
}
