import { EntitySubscriberInterface, UpdateEvent, InsertEvent, RemoveEvent } from 'typeorm';
import { Stock } from '../entities/stock.entity';
export declare class StockSubscriber implements EntitySubscriberInterface<Stock> {
    listenTo(): typeof Stock;
    afterInsert(event: InsertEvent<Stock>): Promise<void>;
    afterUpdate(event: UpdateEvent<Stock>): Promise<void>;
    afterRemove(event: RemoveEvent<Stock>): Promise<void>;
    private updateItemTotalStock;
}
