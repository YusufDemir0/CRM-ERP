import { EntitySubscriberInterface, InsertEvent, UpdateEvent, DataSource } from 'typeorm';
import { ClsService } from 'nestjs-cls';
export declare class AuditSubscriber implements EntitySubscriberInterface {
    private readonly dataSource;
    private readonly cls;
    constructor(dataSource: DataSource, cls: ClsService);
    beforeInsert(event: InsertEvent<any>): void;
    beforeUpdate(event: UpdateEvent<any>): void;
}
