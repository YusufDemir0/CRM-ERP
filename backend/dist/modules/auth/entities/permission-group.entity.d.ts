import { BaseEntity } from '../../../common/entities/base.entity';
import { Permission } from './permission.entity';
export declare class PermissionGroup extends BaseEntity {
    name: string;
    permissions: Permission[];
}
