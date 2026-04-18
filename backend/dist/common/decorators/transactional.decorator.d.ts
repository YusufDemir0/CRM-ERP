import { DataSource } from 'typeorm';
import { ClsService } from 'nestjs-cls';
export declare class TransactionInternal {
    static dataSource: DataSource;
    static cls: ClsService;
}
export declare function Transactional(): (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
