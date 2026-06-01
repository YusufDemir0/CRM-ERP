import { EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent, DataSource } from 'typeorm';
import { ClsService } from 'nestjs-cls';
export declare class AuditSubscriber implements EntitySubscriberInterface {
    private readonly dataSource;
    private readonly cls;
    private readonly logger;
    constructor(dataSource: DataSource, cls: ClsService);
    beforeInsert(event: InsertEvent<unknown>): void;
    beforeUpdate(event: UpdateEvent<unknown>): void;
    afterInsert(event: InsertEvent<unknown>): Promise<void>;
    afterUpdate(event: UpdateEvent<unknown>): Promise<void>;
    afterRemove(event: RemoveEvent<unknown>): Promise<void>;
    private logAction;
    private getFriendlyEntityName;
    private getEntityModule;
    private getEntityFriendlyDescription;
}
